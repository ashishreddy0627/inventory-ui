# Inventory UI

React-based frontend for a small **inventory management system** (gas station / retail style) that talks to a Spring Boot backend.

## Tech Stack

- **Frontend:** React (Create React App)
- **Language:** JavaScript
- **API:** REST calls to Spring Boot backend on `http://localhost:8082`
- **Features:**
  - Create and list **stores**
  - Create and list **items per store**
  - Auto-calculated **reorder list** based on stock vs target
  - Simple, clean dashboard UI

---

## Project Structure

```text
inventory-ui/
  public/
  src/
    App.js        # main dashboard UI
    index.js      # React entry
  package.json
