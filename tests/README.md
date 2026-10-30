# Comprobación local de la presentación

Estas pruebas abren la web en Chrome mediante Playwright. Comprueban el contenido visible, el orden de proyectos, el CV y la presentación en distintos anchos. No prueban los robots ni requieren GitHub Actions.

Desde la raíz del repositorio, en un entorno de pruebas:

```bash
python3 -m venv /tmp/portfolio-tests
/tmp/portfolio-tests/bin/pip install playwright
CHROME_BIN=/usr/bin/google-chrome /tmp/portfolio-tests/bin/python -m unittest discover -s tests -v
```

`CHROME_BIN` debe apuntar al ejecutable de Chrome o Chromium instalado. El CV publicado se genera a partir de `cv.html`; al actualizarlo, exportar también `cv.pdf` con impresión A4 y márgenes de 16 mm.
