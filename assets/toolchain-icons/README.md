# Toolchain icons

These SVGs are vendored locally so the toolchain never depends on a runtime CDN and remains compatible with the site's `img-src 'self'` policy.

- `claude-code.svg`: Claude Code mark from Iconify's `thesvg-color:claude-code`
- `codex.svg`: Codex/OpenAI mark from Iconify's `thesvg-color:codex-light`
- `axure.svg`: Axure's three-colour X mark, cropped from Iconify's `thesvg-color:axure` asset so it fits the square badge
- `figma.svg`: Figma mark from Iconify's `logos:figma`
- `gemini.svg`: Gemini mark from Iconify's `thesvg-color:gemini`
- `deepseek-harness.svg`: local DSH monogram used for the DeepSeek Harness toolchain item
- `workbuddy.svg`: WorkBuddy mark from Iconify's `thesvg-color:workbuddy`
- `obsidian.svg`: Obsidian mark from Iconify's `logos:obsidian-icon`
- `trae.svg`: Trae mark from Iconify's `thesvg-color:trae`

The page includes initials as a small runtime fallback if an individual local asset ever fails to decode.

The vendored vectors are used as local, presentation-only marks. The Iconify sources retain their upstream licenses (CC0 for the `logos` set; MIT for the `thesvg-color` set); the Feishu vector is from Allogo and remains subject to its source terms.
