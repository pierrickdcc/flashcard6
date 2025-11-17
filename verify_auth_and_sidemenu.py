import re
from playwright.sync_api import Page, expect, sync_playwright
import random
import string
import time

def run(playwright):
    # Setup
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    # Generate random user credentials
    random_suffix = ''.join(random.choices(string.ascii_lowercase + string.digits, k=16))
    email = f"testuser_{random_suffix}@jourrapide.com"
    password = "Password123!"

    try:
        # Navigate to login page
        page.goto("http://localhost:5173/login")

        # --- Sign Up ---
        print(f"Attempting to sign up with new user: {email}")
        page.locator('button:has-text("Pas encore de compte ? S\'inscrire")').click()

        confirm_password_input = page.locator("#confirm-password")
        expect(confirm_password_input).to_be_visible(timeout=5000)

        page.locator("#email").fill(email)
        page.locator("#password").fill(password)
        confirm_password_input.fill(password)

        page.locator('button:has-text("S\'inscrire")').click()

        # Sign up submitted. Let's wait for navigation and then explicitly go to the login page for a clean start.
        print("Sign up submitted. Navigating to login page to ensure clean state.")
        page.wait_for_timeout(2000) # Wait 2s for any redirects
        page.goto("http://localhost:5173/login")

        # --- Log In ---
        print(f"Attempting to log in with new user: {email}")

        # Ensure the login form is visible
        email_login_input = page.locator("#email")
        expect(email_login_input).to_be_visible(timeout=10000)

        # The page is fresh, so no need to clear fields.
        password_login_input = page.locator("#password")
        email_login_input.fill(email)
        password_login_input.type(password, delay=50) # Simulate typing

        # DEBUG: Check input value before clicking
        password_value = password_login_input.input_value()
        print(f"DEBUG: Password input value before login click is: '{password_value}'")
        page.wait_for_timeout(500) # Small delay before click

        page.locator('button:has-text("Se connecter")').click()

        # Verify login by checking for a unique element on the home page
        expect(page.locator("header")).to_be_visible(timeout=15000)
        print("Login successful.")

        # --- Verify Side Menu ---
        print("Verifying profile side menu...")

        profile_icon_header = page.locator('header .lucide-circle-user-round')
        expect(profile_icon_header).to_be_visible()
        profile_icon_header.click()

        side_menu = page.locator('.profile-side-menu')
        expect(side_menu).to_be_visible()
        print("Side menu opened successfully from header.")

        expect(side_menu.locator('h2:has-text("Profil")')).to_be_visible()
        expect(side_menu.locator('button:has-text("Importer un JSON")')).to_be_visible()
        expect(side_menu.locator('button:has-text("Exporter un JSON")')).to_be_visible()
        print("Side menu content is correct.")

        side_menu.locator('.lucide-x').click()
        expect(side_menu).not_to_be_visible()
        print("Side menu closed successfully.")

        # --- Final Screenshot ---
        screenshot_path = "/home/jules/verification/success.png"
        page.screenshot(path=screenshot_path)
        print(f"Successfully verified. Screenshot saved to {screenshot_path}")
        return screenshot_path

    except Exception as e:
        print(f"An error occurred: {e}")
        error_path = "/home/jules/verification/error.png"
        page.screenshot(path=error_path)
        print(f"Error screenshot saved to {error_path}")
        raise

    finally:
        # Teardown
        context.close()
        browser.close()

with sync_playwright() as p:
    run(p)
