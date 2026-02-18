**Dependencies**
- gorm
- chi router
- gorilla websocket

**Event States:** 
- `Draft:` Only organizers(authors) and admins.
- `Published:` Everyone sees it, teams can join, but challenges are hidden.
- `Active:` Everything is visible, teams can Submit flags.
- `Ended:` Visible, but no more Submits allowed.

**Resouces**
- Dynamic value scoring: https://docs.ctfd.io/docs/custom-challenges/dynamic-value/