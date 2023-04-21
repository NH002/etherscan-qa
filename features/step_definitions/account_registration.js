const assert = require('assert');
const process = require('process');
const { Given, When, Then, BeforeAll, AfterAll } = require('@cucumber/cucumber');
const { Browser, Builder, By, Key } = require('selenium-webdriver');
const { elementLocated, elementIsVisible } = require('selenium-webdriver/lib/until');

/* === PREAMBLE === */

/* Browser to use for testing */

const BROWSER = process.env.SELENIUM_TEST_BROWSER ? process.env.SELENIUM_TEST_BROWSER : Browser.FIREFOX;

switch (BROWSER) {
    case Browser.FIREFOX:
        require('geckodriver');
        break;
    case Browser.CHROME:
        require('chromedriver');
        break;
    default:
        throw Error('Unsupported browser: ' + BROWSER);
}

/* User registration data */

const TEST_USERNAME = process.env.SELENIUM_TEST_USERNAME ? process.env.SELENIUM_TEST_USERNAME : 'example';
const TEST_EMAIL = process.env.SELENIUM_TEST_EMAIL ? process.env.SELENIUM_TEST_EMAIL : 'example@example.com';
const TEST_PASSWORD = process.env.SELENIUM_TEST_PASSWORD ? process.env.SELENIUM_TEST_PASSWORD : '12345678';

if (!/^\w{5,30}$/.test(TEST_USERNAME) || !/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/.test(TEST_EMAIL) || TEST_PASSWORD.length < 8) {
    throw Error('Invalid user registration data');
}

/* Selenium Grid server */

const GRID_URL = process.env.SELENIUM_TEST_BASIC ? null : (process.env.SELENIUM_TEST_GRID_URL ? process.env.SELENIUM_TEST_GRID_URL : 'http://localhost:4444/');

/* Website URLs */

const REGISTER_URL = "https://etherscan.io/register";
const LOGIN_URL = "https://etherscan.io/login";

/* Timeouts */

const MANUAL_CAPTCHA_TIMEOUT = 60000;   // 60s.

/* Description-element maps */

const mapDescToXpath = {
    'username': '//input[@id="ContentPlaceHolder1_txtUserName"][@type="text"]',
    'email': '//input[@id="ContentPlaceHolder1_txtEmail"][@type="email"]',
    'email confirmation': '//input[@id="ContentPlaceHolder1_txtConfirmEmail"][@type="email"]',
    'password': '//input[@id="ContentPlaceHolder1_txtPassword"][@type="password"]',
    'password confirmation': '//input[@id="ContentPlaceHolder1_txtPassword2"][@type="password"]',
    'terms and conditions': '//input[@id="ContentPlaceHolder1_MyCheckBox"][@type="checkbox"]',
    'account-creating button': '//input[@id="ContentPlaceHolder1_btnRegister"][@type="submit"]',
    'CAPTCHA frame': '//iframe[@title="reCAPTCHA"]',
    'CAPTCHA': '//span[@id="recaptcha-anchor"]',
    'CAPTCHA checkmark': '//span[@id="recaptcha-anchor"][@aria-checked="true"]',
    'alert': '//div[@class="alert alert-danger" or @class="alert alert-info"]',
};

const mapDescToErrorXpath = {
    'username': '//div[@id="ContentPlaceHolder1_txtUserName-error"][@class="invalid-feedback"]',
    'email': '//div[@id="ContentPlaceHolder1_txtEmail-error"][@class="invalid-feedback"]',
    'email confirmation': '//div[@id="ContentPlaceHolder1_txtConfirmEmail-error"][@class="invalid-feedback"]',
    'password': '//div[@id="ContentPlaceHolder1_txtPassword-error"][@class="invalid-feedback"]',
    'password confirmation': '//div[@id="ContentPlaceHolder1_txtPassword2-error"][@class="invalid-feedback"]',
    'terms and conditions': '//div[@id="ctl00$ContentPlaceHolder1$MyCheckBox-error"][@class="invalid-feedback"]',
};

/* Step-handling functions (they provide a level of abstraction) */

// Goes to the registration page.
async function goRegisterUrl() {
    await driver.get(REGISTER_URL);
}

// Clicks the link with the passed-in link text.
async function clickLinkText(linkText) {
    await driver.findElement(By.linkText(linkText)).click();
}

// Clicks on the passed-in button.
async function clickButton(btnDesc) {
    await driver.executeScript('arguments[0].click();', await driver.findElement(By.xpath(mapDescToXpath[btnDesc])));
}

// Types in the first text character into the text box and immediately deletes it.
async function vaporText(textDesc, testValue) {
    await driver.findElement(By.xpath(mapDescToXpath[textDesc])).sendKeys(testValue[0] + Key.BACK_SPACE);
}

// Inserts the text into the text box, repeating it so that the `count` characters are inserted.
async function insertText(textDesc, count, testValue) {
    await driver.findElement(By.xpath(mapDescToXpath[textDesc])).sendKeys(testValue.repeat(count / testValue.length) + testValue.slice(0, count % testValue.length));
}

// Fills in the entire form with valid data.
async function validEverything() {
    await driver.findElement(By.xpath(mapDescToXpath['username'])).sendKeys(TEST_USERNAME);
    await driver.findElement(By.xpath(mapDescToXpath['email'])).sendKeys(TEST_EMAIL);
    await driver.findElement(By.xpath(mapDescToXpath['email confirmation'])).sendKeys(TEST_EMAIL);
    await driver.findElement(By.xpath(mapDescToXpath['password'])).sendKeys(TEST_PASSWORD);
    await driver.findElement(By.xpath(mapDescToXpath['password confirmation'])).sendKeys(TEST_PASSWORD);
    await driver.findElement(By.xpath(mapDescToXpath['terms and conditions'])).click();
}

// Scrolls the CAPTCHA into the view and clicks on it, then waits for the tester to solve it.
async function manuallySolveCAPTCHA() {
    await driver.switchTo().frame(await driver.findElement(By.xpath(mapDescToXpath['CAPTCHA frame'])));
    const btnCaptcha = await driver.findElement(By.xpath(mapDescToXpath['CAPTCHA']));
    await driver.executeScript('arguments[0].scrollIntoView(); arguments[0].click();', btnCaptcha);
    await driver.wait(elementLocated(By.xpath(mapDescToXpath['CAPTCHA checkmark'])));
    await driver.switchTo().frame(null);
}

// Tests whether the current page is the login page.
async function isLoginUrl() {
    assert(LOGIN_URL === await driver.getCurrentUrl());
}

// Tests whether the error message is associated with the element.
async function isErrorMsg(elemDesc, msg) {
    assert(msg === await driver.wait(elementIsVisible(await driver.wait(elementLocated(By.xpath(mapDescToErrorXpath[elemDesc]))))).getText());
}

// Tests whether the text box has contents of length `length`.
async function textHasLength(textDesc, length) {
    assert(length === (await driver.findElement(By.xpath(mapDescToXpath[textDesc])).getAttribute('value')).length);
}

// Tests whether there is an alert with one of the supplied messages (messages are delimited by '/').
async function isAlertMsgs(msgs) {
    const alertText = (await driver.wait(elementLocated(By.xpath(mapDescToXpath['alert'])))).getText();
    assert(msgs.replaceAll('\\n', '\n').split(/\s*(?<!\\)\/\s*/).some(async (msg) => msg === alertText));
}

/* Step-handler map */

const mapProbToSol = {
    given: {
        goRegisterUrl: ['that a user is on the registration page', goRegisterUrl],
    },
    when: {
        clickSignIn: ['they click the link saying {string}', (linkText) => clickLinkText(linkText)],
        nothing: ['they leave everything empty and unchecked', () => undefined],
        clickCreateAccount: ['they click the account-creating button', () => clickButton('account-creating button')],
        putEmptyUsername: ['they modify the username such that it is empty', () => vaporText('username', TEST_USERNAME)],
        putSmallUsername: ['they modify the username such that it has {int}–{int} characters', (_, count) => insertText('username', count, TEST_USERNAME)],
        putBigUsername: ['they try to insert text into the username such that it would have more than {int} characters', (count) => insertText('username', count + 1, TEST_USERNAME)],
        putNonalphaUsername: ['they insert a non-alphanumeric character into the username', () => insertText('username', TEST_USERNAME.length, '.'.repeat(TEST_USERNAME.length))],
        putInvalidEmail: ['they modify the email such that it is invalid', () => insertText('email', TEST_EMAIL.indexOf('@'), TEST_EMAIL)],
        putInvalidEmailConfirm: ['they modify the email confirmation such that it is invalid', () => insertText('email confirmation', TEST_EMAIL.indexOf('@'), TEST_EMAIL)],
        putNonmatchingEmailConfirm: ['they modify the email confirmation such that it doesn\'t match email', () => insertText('email confirmation', TEST_EMAIL.length, TEST_EMAIL)],
        putInvalidPassword: ['they modify the password such that it has {int}–{int} characters', (_, count) => insertText('password', count, TEST_PASSWORD)],
        putInvalidPasswordConfirm: ['they modify the password confirmation such that it has {int}–{int} characters', (_, count) => insertText('password confirmation', count, TEST_PASSWORD)],
        putNonmatchingPasswordConfirm: ['they modify the password confirmation such that it doesn\'t match password', () => insertText('password confirmation', TEST_PASSWORD.length, TEST_PASSWORD.split('').reverse().join(''))],
        validEverything: ['they validly fill in the registration info', validEverything],
        captchaUnsolved: ['they leave the CAPTCHA unsolved', () => undefined],
        captchaSolved: ['they solve the CAPTCHA', { timeout: MANUAL_CAPTCHA_TIMEOUT }, manuallySolveCAPTCHA],
    },
    then: {
        isLoginUrl: ['they should be redirected to the login page', isLoginUrl],
        isUsernameMsg: ['display the message {string} below the username', (msg) => isErrorMsg('username', msg)],
        isEmailMsg: ['display the message {string} below the email', (msg) => isErrorMsg('email', msg)],
        isEmailConfirmMsg: ['display the message {string} below the email confirmation', (msg) => isErrorMsg('email confirmation', msg)],
        isPasswordMsg: ['display the message {string} below the password', (msg) => isErrorMsg('password', msg)],
        isPasswordConfirmMsg: ['display the message {string} below the password confirmation', (msg) => isErrorMsg('password confirmation', msg)],
        isTACMsg: ['display the message {string} below the terms and conditions', (msg) => isErrorMsg('terms and conditions', msg)],
        isBigUsernameClipped: ['clip the overflow characters to insert into the username such that it has {int} characters', (count) => textHasLength('username', count)],
        isAlertMsg: ['display the alert {string}', isAlertMsgs],
    },
};

/* === MAIN === */

const driver = new Builder().disableEnvironmentOverrides().forBrowser(BROWSER).usingServer(GRID_URL).build();

BeforeAll(async function() {
    await driver.manage().window().maximize();
});

Given(...mapProbToSol.given.goRegisterUrl);

When(...mapProbToSol.when.clickSignIn);
When(...mapProbToSol.when.nothing);
When(...mapProbToSol.when.clickCreateAccount);
When(...mapProbToSol.when.putEmptyUsername);
When(...mapProbToSol.when.putSmallUsername);
When(...mapProbToSol.when.putBigUsername);
When(...mapProbToSol.when.putNonalphaUsername);
When(...mapProbToSol.when.putInvalidEmail);
When(...mapProbToSol.when.putInvalidEmailConfirm);
When(...mapProbToSol.when.putNonmatchingEmailConfirm);
When(...mapProbToSol.when.putInvalidPassword);
When(...mapProbToSol.when.putInvalidPasswordConfirm);
When(...mapProbToSol.when.putNonmatchingPasswordConfirm);
When(...mapProbToSol.when.validEverything);
When(...mapProbToSol.when.captchaUnsolved);
When(...mapProbToSol.when.captchaSolved);

Then(...mapProbToSol.then.isLoginUrl);
Then(...mapProbToSol.then.isUsernameMsg);
Then(...mapProbToSol.then.isEmailMsg);
Then(...mapProbToSol.then.isEmailConfirmMsg);
Then(...mapProbToSol.then.isPasswordMsg);
Then(...mapProbToSol.then.isPasswordConfirmMsg);
Then(...mapProbToSol.then.isTACMsg);
Then(...mapProbToSol.then.isBigUsernameClipped);
Then(...mapProbToSol.then.isAlertMsg);

AfterAll(async function() {
    await driver.quit();
});
