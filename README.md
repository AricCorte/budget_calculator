# BudgetFlow — Daily Budget Tracker

A simple browser-only budget tracker designed around a monthly income.

## Features

- Monthly income
- Optional savings / money kept aside
- Automatic normal daily allowance
- Custom extra allowance for every Sunday
- Automatic debt carry-over
- Monthly spending total
- Daily spending history
- Browser `localStorage` persistence
- Responsive design
- No backend required

## Budget logic

Suppose:

- Monthly income = ₹10,000
- Savings = ₹1,000
- Sunday extra = ₹500

The app calculates the money available for normal daily spending and reserves the Sunday extras from that monthly spending pool.

For an ordinary day:

`usable budget = normal daily allowance - previous debt`

For Sunday:

`usable budget = normal daily allowance + Sunday extra - previous debt`

If you spend more than your usable budget:

`remaining = usable budget - spending`

Example:

`₹170 - ₹180 = -₹10`

The next day:

`₹170 - ₹10 = ₹160`

If that next day is Sunday with a ₹500 extra:

`₹170 + ₹500 - ₹10 = ₹660`

Positive leftovers are kept in your month-level balance; negative leftovers become the next day's debt.

## Run locally

Open `index.html` in a browser.

## GitHub Pages

Upload `index.html`, `style.css`, and `script.js` to a repository and enable GitHub Pages. The site is completely static.
