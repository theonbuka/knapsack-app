import pytest
from playwright.sync_api import Page, expect

BASE_URL = "http://localhost:5177"
TEST_USER = {
    "name": "Ege",
    "surname": "Tester",
    "email": "e2e@knapsack.local",
    "password": "123456",
}


def register_user(page: Page):
    page.goto(f"{BASE_URL}/landing")
    page.wait_for_load_state("networkidle")

    page.get_by_role("button", name="Kayıt Ol", exact=True).click()
    page.get_by_placeholder("İsim").fill(TEST_USER["name"])
    page.get_by_placeholder("Soyisim").fill(TEST_USER["surname"])
    page.get_by_placeholder("Email").fill(TEST_USER["email"])
    page.get_by_placeholder("Şifre").fill(TEST_USER["password"])
    page.get_by_role("button", name="Hesap Oluştur").click()

    page.wait_for_url(f"{BASE_URL}/")
    page.wait_for_load_state("networkidle")

@pytest.fixture(autouse=True)
def clear_storage(page: Page):
    page.goto(f"{BASE_URL}/landing")
    page.evaluate("localStorage.clear()")
    page.reload()
    page.wait_for_load_state("networkidle")
    register_user(page)

def test_home_page_loads(page: Page):
    page.wait_for_load_state("networkidle")
    expect(page.locator("h1")).to_contain_text("Knapsack")

def test_home_shows_net_balance(page: Page):
    page.goto(BASE_URL)
    page.wait_for_load_state("networkidle")
    expect(page.get_by_text("Toplam Net Değer")).to_be_visible()

def test_navigation_to_assets(page: Page):
    page.goto(BASE_URL)
    page.wait_for_load_state("networkidle")
    page.get_by_role("link", name="Varlıklarım").click()
    page.wait_for_load_state("networkidle")
    expect(page.locator("h1")).to_contain_text("Varlıklarım")

def test_navigation_to_transactions(page: Page):
    page.goto(BASE_URL)
    page.wait_for_load_state("networkidle")
    page.get_by_role("link", name="İşlemler").click()
    page.wait_for_load_state("networkidle")
    expect(page.locator("h1")).to_contain_text("İşlem Geçmişi")

def test_add_wallet(page: Page):
    page.goto(f"{BASE_URL}/assets")
    page.wait_for_load_state("networkidle")
    page.get_by_role("button", name="Yeni Hesap", exact=True).click()
    page.get_by_placeholder("Hesap / Cüzdan adı").fill("Test Cüzdan")
    page.get_by_placeholder("Bakiye").fill("5000")
    page.locator("form").get_by_role("button", name="Ekle", exact=True).click()
    expect(page.get_by_text("Test Cüzdan")).to_be_visible()

def test_add_transaction(page: Page):
    page.goto(f"{BASE_URL}/transactions")
    page.wait_for_load_state("networkidle")
    page.get_by_label("Yeni işlem ekle").click()
    page.get_by_placeholder("0").fill("250")
    page.get_by_placeholder("Başlık").fill("Test harcama")
    page.get_by_placeholder("Not ekle (opsiyonel)").fill("Test not")
    page.get_by_role("button", name="Kaydet").click()
    expect(page.get_by_text("Test harcama")).to_be_visible()

def test_theme_toggle(page: Page):
    page.goto(BASE_URL)
    page.wait_for_load_state("networkidle")
    html = page.locator("html")
    expect(html).to_have_class("dark")
    page.get_by_label("Açık temaya geç").click()
    expect(html).not_to_have_class("dark")

def test_empty_transactions_message(page: Page):
    page.goto(f"{BASE_URL}/transactions")
    page.wait_for_load_state("networkidle")
    expect(page.get_by_text("Henüz işlem yok")).to_be_visible()

def test_wallet_persists_after_reload(page: Page):
    page.goto(f"{BASE_URL}/assets")
    page.wait_for_load_state("networkidle")
    page.get_by_role("button", name="Yeni Hesap", exact=True).click()
    page.get_by_placeholder("Hesap / Cüzdan adı").fill("Kalıcı Cüzdan")
    page.get_by_placeholder("Bakiye").fill("1000")
    page.locator("form").get_by_role("button", name="Ekle", exact=True).click()
    page.reload()
    page.wait_for_load_state("networkidle")
    expect(page.get_by_text("Kalıcı Cüzdan")).to_be_visible()
