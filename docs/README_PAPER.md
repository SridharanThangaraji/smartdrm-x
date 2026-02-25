# Conference Paper – PDF / HTML

The full paper is in **`conference_paper.md`**.

## Option 1: PDF without installing LaTeX (recommended)

1. **Convert Markdown → HTML** (Pandoc does this without any LaTeX):
   ```bash
   cd /home/rogue/workspace/SmartDRM-X
   pandoc docs/conference_paper.md -o docs/conference_paper_full.html -s --metadata title="SmartDRM-X Conference Paper"
   ```

2. **Open** `docs/conference_paper_full.html` in your browser (e.g. Firefox, Chromium).

3. **Print → Save as PDF** (Ctrl+P → “Save to PDF” or “Print to file”).

You get a PDF with no need for `pdflatex` or TeX Live.

---

## Option 2: PDF with Pandoc + LaTeX (nicer typography)

On **Arch Linux**, the correct package is **`texlive-latex`** (not `pdflatex`):

```bash
sudo pacman -S texlive-latex
```

Then:

```bash
cd /home/rogue/workspace/SmartDRM-X
pandoc docs/conference_paper.md -o docs/conference_paper.pdf --pdf-engine=pdflatex -V geometry:margin=1in
```

If `pdflatex` is still not found, try specifying the engine explicitly:

```bash
pandoc docs/conference_paper.md -o docs/conference_paper.pdf --pdf-engine=pdflatex
```

(After `pacman -S texlive-latex`, the `pdflatex` binary is usually in `PATH.)

---

## Option 3: Online Markdown → PDF

- Paste the contents of `conference_paper.md` into [md2pdf.netlify.app](https://md2pdf.netlify.app/) or [Markdown to PDF](https://www.markdowntopdf.com/) and download the PDF.
- Or use [Pandoc Try](https://pandoc.org/try/) and upload the file.

---

## Summary

| Goal              | Command / action |
|-------------------|------------------|
| PDF, no LaTeX     | `pandoc docs/conference_paper.md -o docs/conference_paper_full.html -s` then open HTML in browser → Print → Save as PDF |
| PDF, with LaTeX   | `sudo pacman -S texlive-latex` then `pandoc docs/conference_paper.md -o docs/conference_paper.pdf --pdf-engine=pdflatex -V geometry:margin=1in` |
| Arch package name | `texlive-latex` (provides `pdflatex`) |
