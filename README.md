## Description

Node.js app utilizing [Cucumber][1] and [Selenium][2] for the purpose of testing the user account registration form at <https://etherscan.io/register>.

For now, only testing on Firefox and Chrome is supported.

## Preparation

After you have cloned the repository, enter the project root and run `npm update`.
That command will download and install all the dependencies.

If you want to make use of Selenium Grid make sure that you have JRE 11 or higher installed.

## Usage

For starters, go into the project root.

If you want to use Selenium Grid run `java -jar selenium-server-4.8.3.jar standalone --config selenium-grid-config.toml`.

Then, to run the tests just execute `npm test`.
Note that you will have to run this command multiple times to achieve parallelism with Selenium Grid.

You can configure the testing parameters through environment variables, namely:

| Environment variable      | Description                               | Allowed values                                | Default value             |
|---------------------------|-------------------------------------------|-----------------------------------------------|---------------------------|
| `SELENIUM_TEST_BASIC`     | Do not use Selenium Grid.                 | anything                                      |                           |
| `SELENIUM_TEST_BROWSER`   | Browser to run the tests on.              | `firefox`, `chrome`                           | `firefox`                 |
| `SELENIUM_TEST_GRID_URL`  | Selenium Grid server URL to connect at.   | anything                                      | `http://localhost:4444/`  |
| `SELENIUM_TEST_USERNAME`  | Account username for registration.        | string of 5-30 characters, only alphanumerics | `example`                 |
| `SELENIUM_TEST_EMAIL`     | Account email address for registration.   | any valid email address                       | `example@example.com`     |
| `SELENIUM_TEST_PASSWORD`  | Account password for registration.        | string of at least 8 characters               | `12345678`                |

Environment overrides are disabled!

The tester must be present while the tests are running in order to manually solve CAPTCHA.

## Implementation

The tools used by this application are:

+ [Cucumber][1], for describing testing scenarios and steps in a human-readable format, and for providing analogous function hooks to which step-handling code can be attached.
+ [Selenium WebDriver][3], for programmatically controlling the browser in executing the step-handling code.
+ Browser driver, depending on the browser. This is a program used by Selenium WebDriver to manipulate the browser. You can find a list of supported browser drivers [here][4].

Basically, what we have here is a three-part system: Cucumber defines the outer shell of the program, letting the tester specify testing scenarios and the steps needed to accomplish them,
while Selenium WebDriver is used to manipulate the browser according to those specifications and get the results of those manipulations, through browser driver.
For each scenario, the retrieved results are compared with the desired ones which determines the scenario's success status.

We can describe this process in more detail as an algorithm, with project root as the starting point:

1. Write tests specifications in Cucumber test files, and place them into `features/` folder.
A test file can contain multiple scenarios, where scenario is a description of a certain feature that the app being tested should have.
A scenario consists of a number of steps which define what is needed to do in order to test whether this feature has been properly implemented,
including the desired results.
2. Place code files implementing Cucumber tests into `features/step_definitions/` folder.
Code files call Cucumber-provided functions to register function handlers for each step of the test files being implemented.
These step-handlers use webdriver, which first must be built with desired capabilities (browser, platform, browser options, etc.), to manipulate the browser and get the results of their manipulations.
In turn, the webdriver uses the corresponding browser driver in order to control the browser.
3. Those results are then compared with the desired ones, and the success status of the scenario is determined.
4. The success statuses of all the scenarios are printed on the console to the tester.

A command (depending on the programming language used) such as `npx cucumber-js` is used to run the testing code.

### Selenium Grid

[Selenium Grid][5] is used to improve the scale and performance of a testing app which uses Selenium WebDriver.
It runs a server to which a testing app could connect as a client and run tests in parallel over multiple remote machines, effectively testing the app over many browsers and operating systems at the same time.
Depending on the situation at hand, there are three main operational modes:

+ **Standalone:** Run everything on a single system, locally.
+ **Hub and Node:** Hub (control unit) runs on a local system and represents the entry point for the testing app. Nodes (testing end-points) can run on the local or remote systems.
+ **Distributed:** All Selenium Grid components are started separately, ideally each on a different system.

You can read about the architecture of Selenium Grid [here][6].

The process of writing the implementation as described in the parent section has not significantly changed except for the additional step of connecting to the Selenium Grid server when building the webdriver.


[1]: https://cucumber.io/
[2]: https://www.selenium.dev/
[3]: https://www.selenium.dev/documentation/webdriver/
[4]: https://www.selenium.dev/documentation/webdriver/getting_started/install_drivers/#quick-reference
[5]: https://www.selenium.dev/documentation/grid/
[6]: https://www.selenium.dev/documentation/grid/architecture/
