import React, { useEffect, useState } from "react";

// Spring Boot backend base URL (includes /api)
const API_BASE_URL = "http://localhost:8082/api";

function App() {
  const [stores, setStores] = useState([]);
  const [selectedStoreId, setSelectedStoreId] = useState(null);

  const [items, setItems] = useState([]);
  const [reorderList, setReorderList] = useState([]);

  const [itemName, setItemName] = useState("");
  const [itemSku, setItemSku] = useState("");
  const [itemBarcode, setItemBarcode] = useState("");
  const [itemUnit, setItemUnit] = useState("");
  const [itemCurrentStock, setItemCurrentStock] = useState("");
  const [itemReorderLevel, setItemReorderLevel] = useState("");
  const [itemTargetStock, setItemTargetStock] = useState("");

  const [statusMessage, setStatusMessage] = useState(null);
  const [loadError, setLoadError] = useState(null);

  const [newStoreName, setNewStoreName] = useState("");
  const [newStoreLocation, setNewStoreLocation] = useState("");

  // Helper to show errors from fetch
  const handleFetchError = async (res) => {
    const text = await res.text();
    throw new Error(
      `HTTP ${res.status} ${res.statusText} for ${res.url}. Body starts with: ${text.slice(
        0,
        80
      )}`
    );
  };

  // ----- API CALLS -----

  const fetchStores = async () => {
    try {
      setLoadError(null);
      const url = `${API_BASE_URL}/stores`;
      console.log("fetchStores ->", url);
      const res = await fetch(url);
      if (!res.ok) {
        await handleFetchError(res);
      }
      const data = await res.json();
      setStores(data);
      if (data.length > 0 && selectedStoreId === null) {
        setSelectedStoreId(data[0].id);
      }
    } catch (err) {
      console.error("Failed to load stores", err);
      setLoadError(err.message || "Failed to load stores");
    }
  };

  const fetchItemsForStore = async (storeId) => {
    try {
      const url = `${API_BASE_URL}/stores/${storeId}/items`;
      console.log("fetchItemsForStore ->", url);
      const res = await fetch(url);
      if (!res.ok) {
        await handleFetchError(res);
      }
      const data = await res.json();
      setItems(data);
    } catch (err) {
      console.error("Failed to load items", err);
      setStatusMessage(err.message || "Failed to load items");
    }
  };

  const fetchReorderList = async (storeId) => {
    try {
      const url = `${API_BASE_URL}/stores/${storeId}/reorder-list`;
      console.log("fetchReorderList ->", url);
      const res = await fetch(url);
      if (!res.ok) {
        await handleFetchError(res);
      }
      const data = await res.json();
      setReorderList(data);
    } catch (err) {
      console.error("Failed to load reorder list", err);
      setStatusMessage(err.message || "Failed to load reorder list");
    }
  };

  // Add Store
  const handleAddStore = async (e) => {
    e.preventDefault();

    if (!newStoreName.trim()) {
      alert("Store name is required");
      return;
    }

    try {
      const url = `${API_BASE_URL}/stores`;
      console.log("handleAddStore ->", url);
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newStoreName.trim(),
          location: newStoreLocation.trim(),
          isActive: true,
        }),
      });

      if (!response.ok) {
        await handleFetchError(response);
      }

      const created = await response.json();
      console.log("Created store:", created);

      // clear form
      setNewStoreName("");
      setNewStoreLocation("");

      setStatusMessage("Store created.");
      await fetchStores();
    } catch (err) {
      console.error("Network/error while creating store:", err);
      setStatusMessage(err.message || "Failed to create store");
    }
  };

  // Add Item
  const handleCreateItem = async (e) => {
    e.preventDefault();
    if (selectedStoreId == null) {
      setStatusMessage("Please select a store first.");
      return;
    }

    setStatusMessage(null);

    try {
      const payload = {
        name: itemName,
        sku: itemSku || null,
        barcode: itemBarcode || null,
        unit: itemUnit || null,
        currentStock: Number(itemCurrentStock),
        reorderLevel: Number(itemReorderLevel),
        targetStock: Number(itemTargetStock),
        storeId: selectedStoreId,
      };

      const url = `${API_BASE_URL}/stores/${selectedStoreId}/items`;
      console.log("handleCreateItem ->", url);
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        await handleFetchError(res);
      }

      setItemName("");
      setItemSku("");
      setItemBarcode("");
      setItemUnit("");
      setItemCurrentStock("");
      setItemReorderLevel("");
      setItemTargetStock("");

      setStatusMessage("Item created.");
      await fetchItemsForStore(selectedStoreId);
      await fetchReorderList(selectedStoreId);
    } catch (err) {
      console.error("Failed to create item", err);
      setStatusMessage(err.message || "Failed to create item");
    }
  };

  // ----- EFFECTS -----

  useEffect(() => {
    console.log("API_BASE_URL =", API_BASE_URL);
    fetchStores();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedStoreId != null) {
      fetchItemsForStore(selectedStoreId);
      fetchReorderList(selectedStoreId);
    } else {
      setItems([]);
      setReorderList([]);
    }
  }, [selectedStoreId]);

  // ----- RENDER -----

  return (
    <div style={{ padding: "1.5rem", maxWidth: 800, margin: "0 auto" }}>
      <h1 style={{ fontSize: "2.2rem", marginBottom: "0.5rem" }}>
        Inventory Dashboard
      </h1>

      <p style={{ marginBottom: "1rem" }}>Backend: {API_BASE_URL}</p>

      <section style={{ marginBottom: "1.5rem" }}>
        <h2>Add New Store</h2>
        <form onSubmit={handleAddStore}>
          <div style={{ marginBottom: "0.5rem" }}>
            <label style={{ display: "block", marginBottom: "0.25rem" }}>
              Store Name
            </label>
            <input
              type="text"
              name="storeName"
              value={newStoreName}
              onChange={(e) => setNewStoreName(e.target.value)}
              required
            />
          </div>

          <div style={{ marginBottom: "0.5rem" }}>
            <label style={{ display: "block", marginBottom: "0.25rem" }}>
              Location (optional)
            </label>
            <input
              type="text"
              name="storeLocation"
              value={newStoreLocation}
              onChange={(e) => setNewStoreLocation(e.target.value)}
            />
          </div>

          <button type="submit">Add Store</button>
        </form>
      </section>

      {loadError && (
        <div
          style={{
            background: "#ffe5e5",
            color: "#900",
            padding: "0.75rem 1rem",
            marginBottom: "1rem",
            borderRadius: 4,
          }}
        >
          {loadError}
        </div>
      )}

      {statusMessage && (
        <div
          style={{
            background: "#e5f7ff",
            color: "#004a75",
            padding: "0.75rem 1rem",
            marginBottom: "1rem",
            borderRadius: 4,
          }}
        >
          {statusMessage}
        </div>
      )}

      {/* Stores list / selector */}
      <section style={{ marginBottom: "1.5rem" }}>
        <h2>Stores</h2>
        {stores.length === 0 ? (
          <p>No stores found. Use the form above to add one.</p>
        ) : (
          <div>
            <label>
              Select store:{" "}
              <select
                value={selectedStoreId ?? ""}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedStoreId(val ? Number(val) : null);
                }}
              >
                <option value="">-- Select --</option>
                {stores.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} (#{s.id})
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}
      </section>

      {/* Add Item */}
      <section
        style={{
          border: "1px solid #ddd",
          borderRadius: 8,
          padding: "1rem",
          marginBottom: "1.5rem",
        }}
      >
        <h2>Add Item to Selected Store</h2>
        {selectedStoreId == null ? (
          <p>Please select a store above before adding items.</p>
        ) : (
          <form onSubmit={handleCreateItem}>
            <div style={{ marginBottom: "0.4rem" }}>
              <label>
                Name:{" "}
                <input
                  name="itemName"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  required
                />
              </label>
            </div>
            <div style={{ marginBottom: "0.4rem" }}>
              <label>
                SKU:{" "}
                <input
                  name="itemSku"
                  value={itemSku}
                  onChange={(e) => setItemSku(e.target.value)}
                />
              </label>
            </div>
            <div style={{ marginBottom: "0.4rem" }}>
              <label>
                Barcode:{" "}
                <input
                  name="itemBarcode"
                  value={itemBarcode}
                  onChange={(e) => setItemBarcode(e.target.value)}
                />
              </label>
            </div>
            <div style={{ marginBottom: "0.4rem" }}>
              <label>
                Unit:{" "}
                <input
                  name="itemUnit"
                  value={itemUnit}
                  onChange={(e) => setItemUnit(e.target.value)}
                  placeholder="bottle, pack, etc."
                />
              </label>
            </div>
            <div style={{ marginBottom: "0.4rem" }}>
              <label>
                Current Stock:{" "}
                <input
                  name="itemCurrentStock"
                  type="number"
                  value={itemCurrentStock}
                  onChange={(e) => setItemCurrentStock(e.target.value)}
                  required
                />
              </label>
            </div>
            <div style={{ marginBottom: "0.4rem" }}>
              <label>
                Reorder Level:{" "}
                <input
                  name="itemReorderLevel"
                  type="number"
                  value={itemReorderLevel}
                  onChange={(e) => setItemReorderLevel(e.target.value)}
                  required
                />
              </label>
            </div>
            <div style={{ marginBottom: "0.4rem" }}>
              <label>
                Target Stock:{" "}
                <input
                  name="itemTargetStock"
                  type="number"
                  value={itemTargetStock}
                  onChange={(e) => setItemTargetStock(e.target.value)}
                  required
                />
              </label>
            </div>
            <button type="submit">Create Item</button>
          </form>
        )}
      </section>

      {/* Inventory list */}
      <section style={{ marginBottom: "1.5rem" }}>
        <h2>Inventory</h2>
        {selectedStoreId == null ? (
          <p>No store selected.</p>
        ) : items.length === 0 ? (
          <p>No items for this store.</p>
        ) : (
          <ul>
            {items.map((it) => (
              <li key={it.id}>
                {it.name} — stock {it.currentStock} / target {it.targetStock}{" "}
                {it.barcode ? `(barcode: ${it.barcode})` : ""}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Reorder list */}
      <section>
        <h2>Reorder List</h2>
        {selectedStoreId == null ? (
          <p>No store selected.</p>
        ) : reorderList.length === 0 ? (
          <p>No items need to be reordered for this store.</p>
        ) : (
          <ul>
            {reorderList.map((r) => (
              <li key={r.itemId}>
                {r.name}: {r.currentStock} in stock, needs{" "}
                {r.reorderQuantity} to reach {r.targetStock}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

export default App;
