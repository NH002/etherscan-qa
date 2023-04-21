Feature: Account registration

    A user wanting to use Etherscan service should be able to register an account at the registration page.

    Scenario: User clicks the link leading to the login page
        Given that a user is on the registration page
        When they click the link saying "Sign In here"
        Then they should be redirected to the login page

    Scenario: User submits registration info with everything left empty and unchecked
        Given that a user is on the registration page
        When they leave everything empty and unchecked
        And they click the account-creating button
        Then display the message "Please enter Username." below the username
        And display the message "Please enter a valid email address." below the email
        And display the message "Please re-enter your email address." below the email confirmation
        And display the message "Please enter Password." below the password
        And display the message "Your password must be at least 8 characters long." below the password confirmation
        And display the message "Please accept our Terms and Conditions." below the terms and conditions

    Scenario: User modifies the username such that it is empty
        Given that a user is on the registration page
        When they modify the username such that it is empty
        Then display the message "Please enter Username." below the username

    Scenario: User modifies the username such that it has 1–4 characters
        Given that a user is on the registration page
        When they modify the username such that it has 1–4 characters
        Then display the message "Please enter at least 5 characters." below the username

    Scenario: User tries to insert more than 30 characters into the username
        Given that a user is on the registration page
        When they try to insert text into the username such that it would have more than 30 characters
        Then clip the overflow characters to insert into the username such that it has 30 characters

    Scenario: User inserts a non-alphanumeric character into the username
        Given that a user is on the registration page
        When they insert a non-alphanumeric character into the username
        Then display the message "Only alphanumeric characters allowed." below the username

    Scenario: User modifies the email such that it is invalid
        Given that a user is on the registration page
        When they modify the email such that it is invalid
        Then display the message "Please enter a valid email address." below the email

    Scenario: User modifies the email confirmation such that it is invalid
        Given that a user is on the registration page
        When they modify the email confirmation such that it is invalid
        Then display the message "Please re-enter your email address." below the email confirmation

    Scenario: User modifies the email confirmation such that it doesn't match email
        Given that a user is on the registration page
        When they modify the email confirmation such that it doesn't match email
        Then display the message "Email address does not match." below the email confirmation

    Scenario: User modifies the password such that it has 1–7 characters
        Given that a user is on the registration page
        When they modify the password such that it has 1–7 characters
        Then display the message "Your password must be at least 8 characters long." below the password

    Scenario: User modifies the password confirmation such that it has 0–7 characters
        Given that a user is on the registration page
        When they modify the password confirmation such that it has 0–7 characters
        Then display the message "Your password must be at least 8 characters long." below the password confirmation

    Scenario: User modifies the password confirmation such that it doesn't match password
        Given that a user is on the registration page
        When they modify the password confirmation such that it doesn't match password
        Then display the message "Password does not match, please check again." below the password confirmation

    Scenario: User submits valid registration info without solving CAPTCHA
        Given that a user is on the registration page
        When they validly fill in the registration info
        And they leave the CAPTCHA unsolved
        And they click the account-creating button
        Then display the alert "Error! Invalid captcha response.\nPlease Try Again"

    Scenario: User submits valid registration info with solved CAPTCHA
        Given that a user is on the registration page
        When they validly fill in the registration info
        And they solve the CAPTCHA
        And they click the account-creating button
        Then display the alert "<validRegistrationInfoSuccessMessage>"

        Examples:
            | validRegistrationInfoSuccessMessage                                                                                                   |
            | Your account registration has been submitted and is\npending email verification. / Sorry! The username you entered is already in use. |
