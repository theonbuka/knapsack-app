import os
from pathlib import Path

import pytest
from playwright.sync_api import Browser, Page, expect

BASE_URL = os.getenv("E2E_BASE_URL", "http://localhost:5177")
SUPABASE_TEST_EMAIL = os.getenv("E2E_SUPABASE_TEST_EMAIL")
SUPABASE_TEST_PASSWORD = os.getenv("E2E_SUPABASE_TEST_PASSWORD")


def cloud_env_configured() -> bool:
    env_path = Path(__file__).resolve().parents[2] / ".env.local"
    if not env_path.exists():
        return False

    content = env_path.read_text(encoding="utf-8")
    if "your-project-id.supabase.co" in content:
        return False
    if "your-anon-public-key" in content:
        return False

    required_keys = ["VITE_SUPABASE_URL=", "VITE_SUPABASE_ANON_KEY="]
    return all(key in content for key in required_keys)


cloud_sync_smoke = pytest.mark.skipif(
    not cloud_env_configured() or not SUPABASE_TEST_EMAIL or not SUPABASE_TEST_PASSWORD,
    reason="Cloud sync smoke requires real Supabase env plus E2E_SUPABASE_TEST_EMAIL/E2E_SUPABASE_TEST_PASSWORD",
)


def register_user(page: Page, email: str, password: str) -> None:
    page.goto(f"{BASE_URL}/landing")
    page.wait_for_load_state("networkidle")

    page.get_by_role("button", name="Kayıt Ol", exact=True).first.click()
    page.locator("input[placeholder='Soyisim']").wait_for(state="visible")
    page.locator("input[placeholder='İsim']").fill("Cloud")
    page.locator("input[placeholder='Soyisim']").fill("Sync")
    page.get_by_placeholder("Email").fill(email)
    page.get_by_placeholder("Şifre").fill(password)
    page.get_by_role("button", name="Hesap Oluştur").click()

    page.wait_for_url(f"{BASE_URL}/")
    page.wait_for_load_state("networkidle")


def login_user(page: Page, email: str, password: str) -> None:
    page.goto(f"{BASE_URL}/landing")
    page.wait_for_load_state("networkidle")

    page.get_by_placeholder("Email").fill(email)
    page.get_by_placeholder("Şifre").fill(password)
    page.get_by_role("button", name="Giriş Yap", exact=True).click()

    page.wait_for_url(f"{BASE_URL}/")
    page.wait_for_load_state("networkidle")


def add_transaction(page: Page, title: str) -> None:
    page.goto(f"{BASE_URL}/transactions")
    page.wait_for_load_state("networkidle")
    page.get_by_label("Yeni işlem ekle").click()
    page.get_by_placeholder("0").fill("777")
    page.get_by_placeholder("Başlık").fill(title)
    page.get_by_placeholder("Not ekle (opsiyonel)").fill("cloud sync smoke")
    page.get_by_role("button", name="Kaydet").click()


def test_local_account_stays_device_only(page: Page) -> None:
    email = f"local-{os.getpid()}-{os.urandom(2).hex()}@knapsack.local"
    password = "123456"

    register_user(page, email, password)

    page.goto(f"{BASE_URL}/settings")
    page.wait_for_load_state("networkidle")

    expect(page.get_by_test_id("settings-auth-provider")).to_have_text("Yerel hesap")
    expect(page.get_by_test_id("settings-sync-status")).to_have_text("Yalnızca bu cihaz")
    expect(page.get_by_test_id("settings-plan-status")).to_have_text("Basic")


@cloud_sync_smoke
def test_cloud_sync_between_two_sessions(browser: Browser) -> None:
    unique_title = f"Cloud TX {os.urandom(2).hex()}"

    context_a = browser.new_context()
    context_b = browser.new_context()

    try:
        page_a = context_a.new_page()
        page_b = context_b.new_page()

        login_user(page_a, SUPABASE_TEST_EMAIL, SUPABASE_TEST_PASSWORD)
        login_user(page_b, SUPABASE_TEST_EMAIL, SUPABASE_TEST_PASSWORD)

        page_a.goto(f"{BASE_URL}/settings")
        page_a.wait_for_load_state("networkidle")
        expect(page_a.get_by_test_id("settings-sync-status")).to_have_text("Bulut senkron aktif")

        page_b.goto(f"{BASE_URL}/settings")
        page_b.wait_for_load_state("networkidle")
        expect(page_b.get_by_test_id("settings-sync-status")).to_have_text("Bulut senkron aktif")

        add_transaction(page_a, unique_title)

        # Debounced cloud push runs shortly after local save.
        page_a.wait_for_timeout(2500)

        page_b.goto(f"{BASE_URL}/transactions")
        page_b.wait_for_load_state("networkidle")
        page_b.reload()
        page_b.wait_for_load_state("networkidle")

        expect(page_b.get_by_text(unique_title)).to_be_visible(timeout=10000)
    finally:
        context_a.close()
        context_b.close()
