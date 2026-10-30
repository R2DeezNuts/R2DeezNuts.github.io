"""Pruebas de la página pública con Chromium/Chrome y Playwright.

Instalar playwright en un entorno de pruebas y ejecutar:
CHROME_BIN=/usr/bin/google-chrome python -m unittest discover -s tests -v
"""
import functools
import http.server
import os
from pathlib import Path
import threading
import unittest

from playwright.sync_api import sync_playwright


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *_):
        pass


class PortfolioTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        root = Path(__file__).resolve().parents[1]
        handler = functools.partial(QuietHandler, directory=str(root))
        cls.server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), handler)
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()
        cls.playwright = sync_playwright().start()
        cls.browser = cls.playwright.chromium.launch(
            executable_path=os.environ.get('CHROME_BIN', '/usr/bin/google-chrome'),
            args=['--no-sandbox'],
        )
        cls.url = f'http://127.0.0.1:{cls.server.server_port}'

    @classmethod
    def tearDownClass(cls):
        cls.browser.close()
        cls.playwright.stop()
        cls.server.shutdown()
        cls.server.server_close()
        cls.thread.join()

    def setUp(self):
        self.page = self.browser.new_page(viewport={'width': 1440, 'height': 1000})
        self.addCleanup(self.page.close)
        self.page.goto(self.url)

    def test_identity_and_completed_work_come_before_concepts(self):
        self.assertEqual(self.page.locator('h1').inner_text(), 'Juan José Prado Neira')
        self.assertIn('Percepción, control y sistemas embebidos', self.page.locator('header').inner_text())
        self.assertEqual(self.page.locator('main h3').all_text_contents(), [
            'Jetson Racer', 'Sumo Vision', 'Robot sumo Eggbots', 'Péndulo invertido', 'USV',
        ])
        self.assertIn('USV', self.page.get_by_role('region', name='En desarrollo', exact=True).inner_text())

    def test_visitor_can_open_cv_projects_and_contact(self):
        cv = self.page.get_by_role('link', name='Descargar CV').get_attribute('href')
        response = self.page.request.get(self.url + '/' + cv)
        self.assertEqual(response.status, 200)
        self.assertTrue(response.body().startswith(b'%PDF'))
        for repo in ['jetson-racer', 'sumo-vision', 'EggBot-Sumo-Battlebot-', 'Pendulo-Invertido']:
            self.assertEqual(self.page.locator(f'main a[href="https://github.com/R2DeezNuts/{repo}"]').count(), 1)
        self.assertTrue(self.page.locator('a[href="mailto:juanjosepradoneira@gmail.com"]').is_visible())
        self.page.get_by_text('Aportación y resultados', exact=True).first.click()
        self.assertTrue(self.page.get_by_text('La prueba integrada conectó', exact=False).is_visible())

    def test_page_remains_readable_on_mobile_and_desktop(self):
        errors = []
        self.page.on('pageerror', lambda error: errors.append(str(error)))
        for width in [320, 768, 1024, 1440]:
            with self.subTest(width=width):
                self.page.set_viewport_size({'width': width, 'height': 1000})
                self.page.reload()
                self.assertEqual(self.page.locator('main h3').count(), 5)
                overflow = self.page.evaluate("""() => [...document.querySelectorAll('main *, header *, footer *')]
                    .filter(el => el.getClientRects().length && getComputedStyle(el).position !== 'absolute')
                    .some(el => el.getBoundingClientRect().right > innerWidth + 1 || el.getBoundingClientRect().left < -1)""")
                self.assertFalse(overflow)
        self.assertEqual(errors, [])
        summary = self.page.get_by_text('Aportación y resultados', exact=True).first
        summary.focus()
        self.page.keyboard.press('Enter')
        self.assertTrue(self.page.get_by_text('La prueba integrada conectó', exact=False).is_visible())

    def test_direct_project_link_keeps_heading_below_navigation(self):
        self.page.goto(self.url + '/#sumo-vision')
        project = self.page.locator('#sumo-vision').bounding_box()
        nav = self.page.locator('nav').bounding_box()
        self.assertGreaterEqual(project['y'], nav['y'] + nav['height'])


if __name__ == '__main__':
    unittest.main()
