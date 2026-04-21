# Mac Chess Bot

Mac Chess Bot is a shareable browser chess game with a built-in bot and a cleaner board UI. The repo also still contains the original native C++ terminal version for macOS.

## Website Version

Main web files:

- `index.html`
- `styles.css`
- `app.js`
- `cover.svg`

Features:

- Real chessboard in the browser
- Click-to-move controls
- Built-in bot opponent
- Legal move validation
- Check, checkmate, and stalemate detection
- Castling support
- Automatic queen promotion
- Share panel with copy-link support
- macOS-friendly layout for Safari and Chrome

## Run Locally

From the repo folder:

```bash
cd cpp-chess-bot
python3 -m http.server 8000
```

Then open:

`http://localhost:8000`

## Put It Online And Send It To A Friend

This repo now includes a GitHub Pages workflow in `.github/workflows/deploy-pages.yml`.

### Steps

1. Push the repo to GitHub.
2. In GitHub, open `Settings > Pages`.
3. Set the source to `GitHub Actions`.
4. Push to `main` or rerun the workflow.

Your public URL will be:

`https://YOUR_USERNAME.github.io/cpp-chess-bot/`

Once the site is live, the app's `Copy Link` button will copy the real public URL so you can send it directly.

## Native C++ Version

The original terminal app is still included in:

- `src/main.cpp`

Build it with:

```bash
cd cpp-chess-bot
clang++ -std=c++17 -O2 -Wall -Wextra -pedantic src/main.cpp -o mac_chess_bot
./mac_chess_bot
```

## Notes

- The bot is intentionally lightweight so the site stays fast.
- `En passant` is not implemented.
