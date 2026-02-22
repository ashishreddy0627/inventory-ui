import React, { useEffect, useState, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";

const API_BASE_URL = "http://localhost:8082";

function App() {
  const [stores, setStores] = useState([]);
  const [selectedStoreId, setSelectedStoreId] = useState(null);
  const [items, setItems] = useState([]);
  const [reorderList, setReorderList] = useState([]);
  const [transactions, setTransactions] = useState([]);
  
  // Form states
  const [newStoreName, setNewStoreName] = useState("");
  const [newStoreLocation, setNewStoreLocation] = useState("");
  const [itemName, setItemName] = useState("");
  const [itemSku, setItemSku] = useState("");
  const [itemBarcode, setItemBarcode] = useState("");
  const [itemUnit, setItemUnit] = useState("");
  const [itemCurrentStock, setItemCurrentStock] = useState("");
  const [itemReorderLevel, setItemReorderLevel] = useState("");
  const [itemTargetStock, setItemTargetStock] = useState("");
  
  // UI states
  const [statusMessage, setStatusMessage] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [adjustmentQuantity, setAdjustmentQuantity] = useState("");
  const [adjustmentNotes, setAdjustmentNotes] = useState("");
  const [showTransactionHistory, setShowTransactionHistory] = useState(false);
  const [selectedItemForHistory, setSelectedItemForHistory] = useState(null);
  const [itemTransactions, setItemTransactions] = useState([]);

  // Barcode scanner states
  const [showScanner, setShowScanner] = useState(false);
  const [scannerError, setScannerError] = useState(null);
  const [scannedItem, setScannedItem] = useState(null);
  const [showScannedItemCard, setShowScannedItemCard] = useState(false);
  const scannerRef = useRef(null);
  const html5QrCodeRef = useRef(null);

  // Edit/Delete states
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingItem, setDeletingItem] = useState(null);
  const [showStoreEditModal, setShowStoreEditModal] = useState(false);
  const [editingStore, setEditingStore] = useState(null);

  const handleFetchError = async (res) => {
    const text = await res.text();
    throw new Error(
      `HTTP ${res.status} ${res.statusText} for ${res.url}. Body starts with: ${text.slice(0, 80)}`
    );
  };

  const fetchStores = async () => {
    try {
      setLoadError(null);
      const res = await fetch(`${API_BASE_URL}/api/stores`);
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
      setLoadError(err.message ?? "Failed to load stores");
    }
  };

  const fetchItemsForStore = async (storeId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/stores/${storeId}/items`);
      if (!res.ok) {
        await handleFetchError(res);
      }
      const data = await res.json();
      setItems(data);
    } catch (err) {
      console.error("Failed to load items", err);
      setStatusMessage(err.message ?? "Failed to load items");
    }
  };

  const fetchReorderList = async (storeId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/stores/${storeId}/reorder-list`);
      if (!res.ok) {
        await handleFetchError(res);
      }
      const data = await res.json();
      setReorderList(data);
    } catch (err) {
      console.error("Failed to load reorder list", err);
      setStatusMessage(err.message ?? "Failed to load reorder list");
    }
  };

  const fetchStoreTransactions = async (storeId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/stores/${storeId}/transactions`);
      if (!res.ok) {
        await handleFetchError(res);
      }
      const data = await res.json();
      setTransactions(data);
    } catch (err) {
      console.error("Failed to load transactions", err);
    }
  };

  const fetchItemTransactions = async (itemId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/items/${itemId}/transactions`);
      if (!res.ok) {
        await handleFetchError(res);
      }
      const data = await res.json();
      setItemTransactions(data);
    } catch (err) {
      console.error("Failed to load item transactions", err);
    }
  };

  const handleAddStore = async (e) => {
    e.preventDefault();
    if (!newStoreName.trim()) {
      alert("Store name is required");
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/api/stores`, {
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
        const text = await response.text();
        console.error("Error creating store:", text);
        alert("Failed to create store");
        return;
      }
      setNewStoreName("");
      setNewStoreLocation("");
      await fetchStores();
    } catch (err) {
      console.error("Network error while creating store:", err);
      alert("Network error while creating store");
    }
  };

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
      const res = await fetch(`${API_BASE_URL}/api/stores/${selectedStoreId}/items`, {
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
      setStatusMessage(err.message ?? "Failed to create item");
    }
  };

  const openStockModal = (item) => {
    setSelectedItem(item);
    setAdjustmentQuantity("");
    setAdjustmentNotes("");
    setShowModal(true);
  };

  const closeStockModal = () => {
    setShowModal(false);
    setSelectedItem(null);
    setAdjustmentQuantity("");
    setAdjustmentNotes("");
  };

  const handleStockAdjustment = async (transactionType) => {
    if (!selectedItem || !adjustmentQuantity || Number(adjustmentQuantity) <= 0) {
      alert("Please enter a valid quantity");
      return;
    }

    const quantity = transactionType === "SALE" 
      ? -Math.abs(Number(adjustmentQuantity))
      : Math.abs(Number(adjustmentQuantity));

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/items/${selectedItem.id}/adjust-stock`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            quantity: quantity,
            type: transactionType,
            notes: adjustmentNotes || null,
          }),
        }
      );

      if (!response.ok) {
        const text = await response.text();
        alert(`Error: ${text}`);
        return;
      }

      setStatusMessage(
        `${transactionType === "SALE" ? "Sale" : "Delivery"} recorded successfully`
      );
      closeStockModal();
      
      // Refresh data
      if (selectedStoreId) {
        await fetchItemsForStore(selectedStoreId);
        await fetchReorderList(selectedStoreId);
        await fetchStoreTransactions(selectedStoreId);
      }
    } catch (err) {
      console.error("Failed to adjust stock", err);
      alert("Network error while adjusting stock");
    }
  };

  const openTransactionHistory = async (item) => {
    setSelectedItemForHistory(item);
    await fetchItemTransactions(item.id);
    setShowTransactionHistory(true);
  };

  const closeTransactionHistory = () => {
    setShowTransactionHistory(false);
    setSelectedItemForHistory(null);
    setItemTransactions([]);
  };

  // Edit Item Functions
  const openEditModal = (item) => {
    setEditingItem({...item});
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingItem(null);
  };

  const handleUpdateItem = async () => {
    if (!editingItem) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/items/${editingItem.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingItem),
      });

      if (!response.ok) {
        const text = await response.text();
        alert(`Error: ${text}`);
        return;
      }

      setStatusMessage("Item updated successfully");
      closeEditModal();
      
      if (selectedStoreId) {
        await fetchItemsForStore(selectedStoreId);
        await fetchReorderList(selectedStoreId);
      }
    } catch (err) {
      console.error("Failed to update item", err);
      alert("Network error while updating item");
    }
  };

  // Delete Item Functions
  const openDeleteConfirm = (item) => {
    setDeletingItem(item);
    setShowDeleteConfirm(true);
  };

  const closeDeleteConfirm = () => {
    setShowDeleteConfirm(false);
    setDeletingItem(null);
  };

  const handleDeleteItem = async () => {
    if (!deletingItem) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/items/${deletingItem.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const text = await response.text();
        alert(`Error: ${text}`);
        return;
      }

      setStatusMessage("Item deleted successfully");
      closeDeleteConfirm();
      
      if (selectedStoreId) {
        await fetchItemsForStore(selectedStoreId);
        await fetchReorderList(selectedStoreId);
        await fetchStoreTransactions(selectedStoreId);
      }
    } catch (err) {
      console.error("Failed to delete item", err);
      alert("Network error while deleting item");
    }
  };

  // Edit Store Functions
  const openStoreEditModal = (store) => {
    setEditingStore({...store});
    setShowStoreEditModal(true);
  };

  const closeStoreEditModal = () => {
    setShowStoreEditModal(false);
    setEditingStore(null);
  };

  const handleUpdateStore = async () => {
    if (!editingStore) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/stores/${editingStore.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingStore),
      });

      if (!response.ok) {
        const text = await response.text();
        alert(`Error: ${text}`);
        return;
      }

      setStatusMessage("Store updated successfully");
      closeStoreEditModal();
      await fetchStores();
    } catch (err) {
      console.error("Failed to update store", err);
      alert("Network error while updating store");
    }
  };

  const handleDeleteStore = async (storeId) => {
    if (!window.confirm("Are you sure you want to delete this store? This will fail if the store has items.")) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/stores/${storeId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const text = await response.text();
        alert(`Error: ${text}`);
        return;
      }

      setStatusMessage("Store deleted successfully");
      setSelectedStoreId(null);
      await fetchStores();
    } catch (err) {
      console.error("Failed to delete store", err);
      alert("Network error while deleting store");
    }
  };

  // Barcode Scanner Functions
  const startScanner = async () => {
    if (!selectedStoreId) {
      alert("Please select a store first");
      return;
    }

    setShowScanner(true);
    setScannerError(null);
    
    try {
      const html5QrCode = new Html5Qrcode("barcode-scanner");
      html5QrCodeRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        onScanSuccess,
        onScanError
      );
    } catch (err) {
      console.error("Scanner start error:", err);
      setScannerError("Failed to start camera. Please check permissions.");
    }
  };

  const stopScanner = async () => {
    if (html5QrCodeRef.current) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
        html5QrCodeRef.current = null;
      } catch (err) {
        console.error("Error stopping scanner:", err);
      }
    }
    setShowScanner(false);
    setScannerError(null);
  };

  const onScanSuccess = async (decodedText, decodedResult) => {
    console.log("Barcode scanned:", decodedText);
    
    await stopScanner();

    try {
      const res = await fetch(
        `${API_BASE_URL}/api/stores/${selectedStoreId}/items/by-barcode/${decodedText}`
      );
      
      if (res.ok) {
        const item = await res.json();
        setScannedItem(item);
        setShowScannedItemCard(true);
      } else {
        alert(`Item with barcode "${decodedText}" not found in this store`);
      }
    } catch (err) {
      console.error("Error looking up barcode:", err);
      alert("Error looking up item");
    }
  };

  const onScanError = (errorMessage) => {
    // Ignore frequent scan errors
  };

  const closeScannedItemCard = () => {
    setShowScannedItemCard(false);
    setScannedItem(null);
  };

  const handleScannedItemAdjustStock = () => {
    closeScannedItemCard();
    openStockModal(scannedItem);
  };

  const handleScannedItemViewHistory = async () => {
    closeScannedItemCard();
    await openTransactionHistory(scannedItem);
  };

  useEffect(() => {
    fetchStores();
  }, []);

  useEffect(() => {
    if (selectedStoreId != null) {
      fetchItemsForStore(selectedStoreId);
      fetchReorderList(selectedStoreId);
      fetchStoreTransactions(selectedStoreId);
    } else {
      setItems([]);
      setReorderList([]);
      setTransactions([]);
    }
  }, [selectedStoreId]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <div style={{ padding: "1.5rem", maxWidth: 1000, margin: "0 auto" }}>
      <h1 style={{ fontSize: "2.2rem", marginBottom: "0.5rem" }}>
        Inventory Dashboard
      </h1>

      {/* Add New Store Section */}
      <section style={{ marginBottom: "1.5rem" }}>
        <h2>Add New Store</h2>
        <form onSubmit={handleAddStore}>
          <div style={{ marginBottom: "0.5rem" }}>
            <label style={{ display: "block", marginBottom: "0.25rem" }}>
              Store Name
            </label>
            <input
              type="text"
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
              value={newStoreLocation}
              onChange={(e) => setNewStoreLocation(e.target.value)}
            />
          </div>
          <button type="submit">Add Store</button>
        </form>
      </section>

      <p style={{ marginBottom: "1rem" }}>Backend: {API_BASE_URL}</p>

      {/* Error and Status Messages */}
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

      {/* Store Selection */}
      <section style={{ marginBottom: "1.5rem" }}>
        <h2>Stores</h2>
        {stores.length === 0 ? (
          <p>No stores found. Use the form above to add one.</p>
        ) : (
          <div>
            <div style={{ display: "flex", gap: "1rem", alignItems: "center", marginBottom: "1rem" }}>
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
              
              <button
                onClick={startScanner}
                disabled={!selectedStoreId}
                style={{
                  padding: "0.5rem 1rem",
                  background: "#007bff",
                  color: "white",
                  border: "none",
                  borderRadius: 4,
                  cursor: selectedStoreId ? "pointer" : "not-allowed",
                  opacity: selectedStoreId ? 1 : 0.5,
                }}
              >
                📱 Scan Barcode
              </button>
            </div>

            {/* Store Edit/Delete Buttons */}
            {selectedStoreId && (
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button
                  onClick={() => {
                    const store = stores.find(s => s.id === selectedStoreId);
                    if (store) openStoreEditModal(store);
                  }}
                  style={{
                    padding: "0.4rem 0.8rem",
                    background: "#ffc107",
                    color: "#000",
                    border: "none",
                    borderRadius: 4,
                    cursor: "pointer",
                  }}
                >
                  ✏️ Edit Store
                </button>
                <button
                  onClick={() => handleDeleteStore(selectedStoreId)}
                  style={{
                    padding: "0.4rem 0.8rem",
                    background: "#dc3545",
                    color: "white",
                    border: "none",
                    borderRadius: 4,
                    cursor: "pointer",
                  }}
                >
                  🗑️ Delete Store
                </button>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Add Item Section */}
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
                  value={itemSku}
                  onChange={(e) => setItemSku(e.target.value)}
                />
              </label>
            </div>
            <div style={{ marginBottom: "0.4rem" }}>
              <label>
                Barcode:{" "}
                <input
                  value={itemBarcode}
                  onChange={(e) => setItemBarcode(e.target.value)}
                />
              </label>
            </div>
            <div style={{ marginBottom: "0.4rem" }}>
              <label>
                Unit:{" "}
                <input
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

      {/* Inventory List */}
      <section style={{ marginBottom: "1.5rem" }}>
        <h2>Inventory</h2>
        {selectedStoreId == null ? (
          <p>No store selected.</p>
        ) : items.length === 0 ? (
          <p>No items for this store.</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #ddd" }}>
                <th style={{ textAlign: "left", padding: "0.5rem" }}>Item</th>
                <th style={{ textAlign: "left", padding: "0.5rem" }}>Stock</th>
                <th style={{ textAlign: "left", padding: "0.5rem" }}>Barcode</th>
                <th style={{ textAlign: "left", padding: "0.5rem" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} style={{ borderBottom: "1px solid #eee" }}>
                  <td style={{ padding: "0.5rem" }}>{item.name}</td>
                  <td style={{ padding: "0.5rem" }}>
                    {item.currentStock} / {item.targetStock}
                  </td>
                  <td style={{ padding: "0.5rem" }}>
                    {item.barcode || "—"}
                  </td>
                  <td style={{ padding: "0.5rem" }}>
                    <button
                      onClick={() => openStockModal(item)}
                      style={{
                        marginRight: "0.5rem",
                        padding: "0.25rem 0.5rem",
                        background: "#007bff",
                        color: "white",
                        border: "none",
                        borderRadius: 3,
                        cursor: "pointer",
                        fontSize: "0.85rem",
                      }}
                    >
                      Adjust
                    </button>
                    <button
                      onClick={() => openTransactionHistory(item)}
                      style={{
                        marginRight: "0.5rem",
                        padding: "0.25rem 0.5rem",
                        background: "#28a745",
                        color: "white",
                        border: "none",
                        borderRadius: 3,
                        cursor: "pointer",
                        fontSize: "0.85rem",
                      }}
                    >
                      History
                    </button>
                    <button
                      onClick={() => openEditModal(item)}
                      style={{
                        marginRight: "0.5rem",
                        padding: "0.25rem 0.5rem",
                        background: "#ffc107",
                        color: "#000",
                        border: "none",
                        borderRadius: 3,
                        cursor: "pointer",
                        fontSize: "0.85rem",
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => openDeleteConfirm(item)}
                      style={{
                        padding: "0.25rem 0.5rem",
                        background: "#dc3545",
                        color: "white",
                        border: "none",
                        borderRadius: 3,
                        cursor: "pointer",
                        fontSize: "0.85rem",
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* Reorder List */}
      <section style={{ marginBottom: "1.5rem" }}>
        <h2>Reorder List</h2>
        {selectedStoreId == null ? (
          <p>No store selected.</p>
        ) : reorderList.length === 0 ? (
          <p>No items need to be reordered for this store.</p>
        ) : (
          <ul>
            {reorderList.map((r) => (
              <li key={r.itemId}>
                {r.name}: {r.currentStock} in stock, needs {r.reorderQuantity}{" "}
                to reach {r.targetStock}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Store Transaction History */}
      <section>
        <h2>
          Recent Transactions
          <button
            onClick={() =>
              selectedStoreId && fetchStoreTransactions(selectedStoreId)
            }
            style={{ marginLeft: "1rem", padding: "0.25rem 0.5rem" }}
          >
            Refresh
          </button>
        </h2>
        {transactions.length === 0 ? (
          <p>No transactions yet.</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #ddd" }}>
                <th style={{ textAlign: "left", padding: "0.5rem" }}>Date</th>
                <th style={{ textAlign: "left", padding: "0.5rem" }}>Item ID</th>
                <th style={{ textAlign: "left", padding: "0.5rem" }}>Type</th>
                <th style={{ textAlign: "left", padding: "0.5rem" }}>Quantity</th>
                <th style={{ textAlign: "left", padding: "0.5rem" }}>Before</th>
                <th style={{ textAlign: "left", padding: "0.5rem" }}>After</th>
                <th style={{ textAlign: "left", padding: "0.5rem" }}>Notes</th>
              </tr>
            </thead>
            <tbody>
              {transactions.slice(0, 20).map((tx) => (
                <tr key={tx.id} style={{ borderBottom: "1px solid #eee" }}>
                  <td style={{ padding: "0.5rem" }}>
                    {formatDate(tx.transactionDate)}
                  </td>
                  <td style={{ padding: "0.5rem" }}>#{tx.itemId}</td>
                  <td style={{ padding: "0.5rem" }}>
                    <span
                      style={{
                        padding: "0.2rem 0.4rem",
                        borderRadius: 4,
                        fontSize: "0.8rem",
                        background:
                          tx.type === "SALE"
                            ? "#ffe5e5"
                            : tx.type === "DELIVERY"
                            ? "#e5f7e5"
                            : "#f0f0f0",
                        color:
                          tx.type === "SALE"
                            ? "#900"
                            : tx.type === "DELIVERY"
                            ? "#060"
                            : "#333",
                      }}
                    >
                      {tx.type}
                    </span>
                  </td>
                  <td style={{ padding: "0.5rem" }}>
                    {tx.quantity > 0 ? `+${tx.quantity}` : tx.quantity}
                  </td>
                  <td style={{ padding: "0.5rem" }}>{tx.stockBefore}</td>
                  <td style={{ padding: "0.5rem" }}>{tx.stockAfter}</td>
                  <td style={{ padding: "0.5rem" }}>{tx.notes || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* Edit Item Modal */}
      {showEditModal && editingItem && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={closeEditModal}
        >
          <div
            style={{
              background: "white",
              padding: "2rem",
              borderRadius: 8,
              maxWidth: 500,
              width: "90%",
              maxHeight: "80vh",
              overflow: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2>Edit Item: {editingItem.name}</h2>

            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", marginBottom: "0.5rem" }}>
                Name:
                <input
                  type="text"
                  value={editingItem.name}
                  onChange={(e) => setEditingItem({...editingItem, name: e.target.value})}
                  style={{
                    width: "100%",
                    padding: "0.5rem",
                    marginTop: "0.25rem",
                  }}
                />
              </label>
            </div>

            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", marginBottom: "0.5rem" }}>
                SKU:
                <input
                  type="text"
                  value={editingItem.sku || ""}
                  onChange={(e) => setEditingItem({...editingItem, sku: e.target.value})}
                  style={{
                    width: "100%",
                    padding: "0.5rem",
                    marginTop: "0.25rem",
                  }}
                />
              </label>
            </div>

            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", marginBottom: "0.5rem" }}>
                Barcode:
                <input
                  type="text"
                  value={editingItem.barcode || ""}
                  onChange={(e) => setEditingItem({...editingItem, barcode: e.target.value})}
                  style={{
                    width: "100%",
                    padding: "0.5rem",
                    marginTop: "0.25rem",
                  }}
                />
              </label>
            </div>

            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", marginBottom: "0.5rem" }}>
                Unit:
                <input
                  type="text"
                  value={editingItem.unit || ""}
                  onChange={(e) => setEditingItem({...editingItem, unit: e.target.value})}
                  style={{
                    width: "100%",
                    padding: "0.5rem",
                    marginTop: "0.25rem",
                  }}
                />
              </label>
            </div>

            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", marginBottom: "0.5rem" }}>
                Current Stock:
                <input
                  type="number"
                  value={editingItem.currentStock}
                  onChange={(e) => setEditingItem({...editingItem, currentStock: Number(e.target.value)})}
                  style={{
                    width: "100%",
                    padding: "0.5rem",
                    marginTop: "0.25rem",
                  }}
                />
              </label>
            </div>

            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", marginBottom: "0.5rem" }}>
                Reorder Level:
                <input
                  type="number"
                  value={editingItem.reorderLevel}
                  onChange={(e) => setEditingItem({...editingItem, reorderLevel: Number(e.target.value)})}
                  style={{
                    width: "100%",
                    padding: "0.5rem",
                    marginTop: "0.25rem",
                  }}
                />
              </label>
            </div>

            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", marginBottom: "0.5rem" }}>
                Target Stock:
                <input
                  type="number"
                  value={editingItem.targetStock}
                  onChange={(e) => setEditingItem({...editingItem, targetStock: Number(e.target.value)})}
                  style={{
                    width: "100%",
                    padding: "0.5rem",
                    marginTop: "0.25rem",
                  }}
                />
              </label>
            </div>

            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                onClick={handleUpdateItem}
                style={{
                  flex: 1,
                  padding: "0.75rem",
                  background: "#28a745",
                  color: "white",
                  border: "none",
                  borderRadius: 4,
                  cursor: "pointer",
                }}
              >
                Save Changes
              </button>
              <button
                onClick={closeEditModal}
                style={{
                  flex: 1,
                  padding: "0.75rem",
                  background: "#6c757d",
                  color: "white",
                  border: "none",
                  borderRadius: 4,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && deletingItem && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={closeDeleteConfirm}
        >
          <div
            style={{
              background: "white",
              padding: "2rem",
              borderRadius: 8,
              maxWidth: 400,
              width: "90%",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2>Delete Item?</h2>
            <p>
              Are you sure you want to delete <strong>{deletingItem.name}</strong>?
            </p>
            <p style={{ color: "#dc3545", fontSize: "0.9rem" }}>
              This action cannot be undone. All transaction history for this item will be preserved.
            </p>

            <div style={{ display: "flex", gap: "0.5rem", marginTop: "1.5rem" }}>
              <button
                onClick={handleDeleteItem}
                style={{
                  flex: 1,
                  padding: "0.75rem",
                  background: "#dc3545",
                  color: "white",
                  border: "none",
                  borderRadius: 4,
                  cursor: "pointer",
                }}
              >
                Yes, Delete
              </button>
              <button
                onClick={closeDeleteConfirm}
                style={{
                  flex: 1,
                  padding: "0.75rem",
                  background: "#6c757d",
                  color: "white",
                  border: "none",
                  borderRadius: 4,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Store Modal */}
      {showStoreEditModal && editingStore && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={closeStoreEditModal}
        >
          <div
            style={{
              background: "white",
              padding: "2rem",
              borderRadius: 8,
              maxWidth: 500,
              width: "90%",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2>Edit Store</h2>

            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", marginBottom: "0.5rem" }}>
                Store Name:
                <input
                  type="text"
                  value={editingStore.name}
                  onChange={(e) => setEditingStore({...editingStore, name: e.target.value})}
                  style={{
                    width: "100%",
                    padding: "0.5rem",
                    marginTop: "0.25rem",
                  }}
                />
              </label>
            </div>

            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", marginBottom: "0.5rem" }}>
                Location:
                <input
                  type="text"
                  value={editingStore.location || ""}
                  onChange={(e) => setEditingStore({...editingStore, location: e.target.value})}
                  style={{
                    width: "100%",
                    padding: "0.5rem",
                    marginTop: "0.25rem",
                  }}
                />
              </label>
            </div>

            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                onClick={handleUpdateStore}
                style={{
                  flex: 1,
                  padding: "0.75rem",
                  background: "#28a745",
                  color: "white",
                  border: "none",
                  borderRadius: 4,
                  cursor: "pointer",
                }}
              >
                Save Changes
              </button>
              <button
                onClick={closeStoreEditModal}
                style={{
                  flex: 1,
                  padding: "0.75rem",
                  background: "#6c757d",
                  color: "white",
                  border: "none",
                  borderRadius: 4,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* [Previous modals: Scanner, Scanned Item Card, Stock Adjustment, Transaction History - keeping all the same] */}
      {/* Barcode Scanner Modal */}
      {showScanner && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.9)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 2000,
          }}
          onClick={stopScanner}
        >
          <div
            style={{
              background: "white",
              padding: "2rem",
              borderRadius: 8,
              maxWidth: 600,
              width: "90%",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2>Scan Barcode</h2>
            <p>Point your camera at the item barcode</p>

            {scannerError && (
              <div style={{ 
                background: "#ffe5e5", 
                color: "#900", 
                padding: "0.75rem", 
                marginBottom: "1rem",
                borderRadius: 4 
              }}>
                {scannerError}
              </div>
            )}

            <div
              id="barcode-scanner"
              style={{
                width: "100%",
                maxWidth: "500px",
                margin: "1rem auto",
                border: "2px solid #ddd",
                borderRadius: 8,
              }}
            ></div>

            <button
              onClick={stopScanner}
              style={{
                width: "100%",
                padding: "0.75rem",
                background: "#6c757d",
                color: "white",
                border: "none",
                borderRadius: 4,
                cursor: "pointer",
                marginTop: "1rem",
              }}
            >
              Close Scanner
            </button>
          </div>
        </div>
      )}

      {/* Scanned Item Details Card */}
      {showScannedItemCard && scannedItem && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 2000,
          }}
          onClick={closeScannedItemCard}
        >
          <div
            style={{
              background: "white",
              padding: "2rem",
              borderRadius: 8,
              maxWidth: 500,
              width: "90%",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2>Item Found! 🎉</h2>
            
            <div style={{ 
              background: "#f8f9fa", 
              padding: "1rem", 
              borderRadius: 4,
              marginBottom: "1.5rem" 
            }}>
              <h3 style={{ marginTop: 0 }}>{scannedItem.name}</h3>
              <p style={{ margin: "0.5rem 0" }}>
                <strong>Barcode:</strong> {scannedItem.barcode}
              </p>
              <p style={{ margin: "0.5rem 0" }}>
                <strong>Current Stock:</strong> {scannedItem.currentStock}
              </p>
              <p style={{ margin: "0.5rem 0" }}>
                <strong>Target Stock:</strong> {scannedItem.targetStock}
              </p>
              {scannedItem.sku && (
                <p style={{ margin: "0.5rem 0" }}>
                  <strong>SKU:</strong> {scannedItem.sku}
                </p>
              )}
            </div>

            <p style={{ marginBottom: "1rem", color: "#666" }}>
              What would you like to do?
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <button
                onClick={handleScannedItemAdjustStock}
                style={{
                  padding: "0.75rem",
                  background: "#007bff",
                  color: "white",
                  border: "none",
                  borderRadius: 4,
                  cursor: "pointer",
                  fontSize: "1rem",
                }}
              >
                📦 Adjust Stock
              </button>
              <button
                onClick={handleScannedItemViewHistory}
                style={{
                  padding: "0.75rem",
                  background: "#28a745",
                  color: "white",
                  border: "none",
                  borderRadius: 4,
                  cursor: "pointer",
                  fontSize: "1rem",
                }}
              >
                📊 View Transaction History
              </button>
              <button
                onClick={closeScannedItemCard}
                style={{
                  padding: "0.75rem",
                  background: "#6c757d",
                  color: "white",
                  border: "none",
                  borderRadius: 4,
                  cursor: "pointer",
                  fontSize: "1rem",
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      {showModal && selectedItem && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={closeStockModal}
        >
          <div
            style={{
              background: "white",
              padding: "2rem",
              borderRadius: 8,
              maxWidth: 500,
              width: "90%",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2>Adjust Stock: {selectedItem.name}</h2>
            <p>
              Current Stock: <strong>{selectedItem.currentStock}</strong>
            </p>

            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", marginBottom: "0.5rem" }}>
                Quantity:
                <input
                  type="number"
                  value={adjustmentQuantity}
                  onChange={(e) => setAdjustmentQuantity(e.target.value)}
                  min="1"
                  style={{
                    width: "100%",
                    padding: "0.5rem",
                    marginTop: "0.25rem",
                  }}
                  placeholder="Enter quantity"
                />
              </label>
            </div>

            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", marginBottom: "0.5rem" }}>
                Notes (optional):
                <input
                  type="text"
                  value={adjustmentNotes}
                  onChange={(e) => setAdjustmentNotes(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.5rem",
                    marginTop: "0.25rem",
                  }}
                  placeholder="e.g., Customer purchase, Supplier delivery"
                />
              </label>
            </div>

            <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
              <button
                onClick={() => handleStockAdjustment("SALE")}
                style={{
                  flex: 1,
                  padding: "0.75rem",
                  background: "#dc3545",
                  color: "white",
                  border: "none",
                  borderRadius: 4,
                  cursor: "pointer",
                }}
              >
                Record Sale (-)
              </button>
              <button
                onClick={() => handleStockAdjustment("DELIVERY")}
                style={{
                  flex: 1,
                  padding: "0.75rem",
                  background: "#28a745",
                  color: "white",
                  border: "none",
                  borderRadius: 4,
                  cursor: "pointer",
                }}
              >
                Add Delivery (+)
              </button>
            </div>

            <button
              onClick={closeStockModal}
              style={{
                width: "100%",
                padding: "0.75rem",
                background: "#6c757d",
                color: "white",
                border: "none",
                borderRadius: 4,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Item Transaction History Modal */}
      {showTransactionHistory && selectedItemForHistory && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={closeTransactionHistory}
        >
          <div
            style={{
              background: "white",
              padding: "2rem",
              borderRadius: 8,
              maxWidth: 700,
              width: "90%",
              maxHeight: "80vh",
              overflow: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2>Transaction History: {selectedItemForHistory.name}</h2>
            
            {itemTransactions.length === 0 ? (
              <p>No transactions for this item.</p>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #ddd" }}>
                    <th style={{ textAlign: "left", padding: "0.5rem" }}>Date</th>
                    <th style={{ textAlign: "left", padding: "0.5rem" }}>Type</th>
                    <th style={{ textAlign: "left", padding: "0.5rem" }}>Qty</th>
                    <th style={{ textAlign: "left", padding: "0.5rem" }}>Before</th>
                    <th style={{ textAlign: "left", padding: "0.5rem" }}>After</th>
                    <th style={{ textAlign: "left", padding: "0.5rem" }}>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {itemTransactions.map((tx) => (
                    <tr key={tx.id} style={{ borderBottom: "1px solid #eee" }}>
                      <td style={{ padding: "0.5rem" }}>
                        {formatDate(tx.transactionDate)}
                      </td>
                      <td style={{ padding: "0.5rem" }}>
                        <span
                          style={{
                            padding: "0.2rem 0.4rem",
                            borderRadius: 4,
                            fontSize: "0.8rem",
                            background:
                              tx.type === "SALE"
                                ? "#ffe5e5"
                                : tx.type === "DELIVERY"
                                ? "#e5f7e5"
                                : "#f0f0f0",
                            color:
                              tx.type === "SALE"
                                ? "#900"
                                : tx.type === "DELIVERY"
                                ? "#060"
                                : "#333",
                          }}
                        >
                          {tx.type}
                        </span>
                      </td>
                      <td style={{ padding: "0.5rem" }}>
                        {tx.quantity > 0 ? `+${tx.quantity}` : tx.quantity}
                      </td>
                      <td style={{ padding: "0.5rem" }}>{tx.stockBefore}</td>
                      <td style={{ padding: "0.5rem" }}>{tx.stockAfter}</td>
                      <td style={{ padding: "0.5rem" }}>{tx.notes || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            <button
              onClick={closeTransactionHistory}
              style={{
                width: "100%",
                padding: "0.75rem",
                background: "#6c757d",
                color: "white",
                border: "none",
                borderRadius: 4,
                cursor: "pointer",
                marginTop: "1rem",
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;