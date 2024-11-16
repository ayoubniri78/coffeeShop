
let products = [];

// Fetch products from the API
function getProducts() {
    fetch('https://fake-coffee-api.vercel.app/api')
        .then(response => response.json())
        .then(data => {
            products = data;
            addProductsToDB(products); // Stocker les produits dans IndexedDB
            displayProducts(products); // Afficher les produits récupérés
            console.log("Produits récupérés depuis l'API :", products);
        })
        .catch(error => {
            console.error("Erreur lors de la récupération des produits :", error);
            loadProductsFromDB(); // Charger depuis IndexedDB en cas d'échec
        });
}



function loadProductsFromDB() {
    const dbRequest = openDB();

    dbRequest.onsuccess = (event) => {
        const db = event.target.result;

        // Ouvrir une transaction en lecture sur l'object store "products"
        const transaction = db.transaction("products", "readonly");
        const store = transaction.objectStore("products");

        const getAllRequest = store.getAll();

        getAllRequest.onsuccess = (event) => {
            const products = event.target.result;

            if (products.length > 0) {
                displayProducts(products); // Afficher les produits récupérés d'IndexedDB
                console.log("Produits chargés depuis IndexedDB :", products);
            } else {
                console.log("Aucun produit trouvé dans IndexedDB.");
            }
        };

        getAllRequest.onerror = () => {
            console.error("Erreur lors de la récupération des produits depuis IndexedDB.");
        };
    };

    dbRequest.onerror = () => {
        console.error("Erreur lors de l'ouverture de la base de données.");
    };
}
function addToCart(productId) {
    // Trouver le produit correspondant à l'ID
    let product_detail = products.find(p => p.id == productId);

    if (!product_detail) {
        console.error("Produit introuvable avec l'ID :", productId);
        return;
    }

    const cartItem = {
        id: productId,
        image_url: product_detail.image_url,
        name: product_detail.name,
        price: product_detail.price,
        quantity: 1
    };

    console.log("Tentative d'ajout au panier :", cartItem);

    // Ouvrir la base de données
    const dbRequest = openDB();

    dbRequest.onsuccess = (event) => {
        const db = event.target.result;
        const transaction = db.transaction("cart", "readwrite");
        const store = transaction.objectStore("cart");

        // Vérifier si l'article est déjà dans le panier
        const getRequest = store.get(productId);

        getRequest.onsuccess = () => {
            const existingItem = getRequest.result;

            if (existingItem) {
                existingItem.quantity += 1;
                store.put(existingItem);
                console.log("Quantité mise à jour pour l'article :", existingItem);
            } else {
                store.add(cartItem);
                console.log("Produit ajouté au panier :", cartItem);
            }
        };

        getRequest.onerror = () => {
            console.error("Erreur lors de la vérification du panier.");
        };

        transaction.oncomplete = () => {
            console.log("Transaction réussie pour l'ajout au panier.");
        };

        transaction.onerror = (event) => {
            console.error("Erreur lors de la transaction :", event.target.error);
        };
    };

    dbRequest.onerror = () => {
        console.error("Erreur lors de l'ouverture de la base de données.");
    };
}



function addProductsToDB(products) {
    // a) Ouvrir une connexion à la base de données
    const dbRequest = openDB();

    dbRequest.onsuccess = (event) => {
        const db = event.target.result;

        // b) Stocker les produits reçus en paramètre dans cet object store
        const transaction = db.transaction("products", "readwrite");
        const store = transaction.objectStore("products");

        products.forEach(product => {
            store.put(product);
        });

        // c) Afficher un message de succès dans la console
        transaction.oncomplete = () => {
            console.log("Produits ajoutés avec succès à la base de données !");
        };
    };

    dbRequest.onerror = () => {
        console.error("Erreur lors de l'ouverture de la base de données.");
    };
}

function openDB() {
    const dbRequest = indexedDB.open("CoffeeShopDB", 1);

    dbRequest.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains("products")) {
            db.createObjectStore("products", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("cart")) {
            db.createObjectStore("cart", { keyPath: "id" });
        }
    };

    return dbRequest;
}

// Create a product card
function createProductCard(product) {
    const card = document.createElement('div');
    card.classList.add('product-card');

    const img = document.createElement('img');
    img.src = product.image_url;
    img.alt = product.name;

    const title = document.createElement('h3');
    title.textContent = product.name;

    const price = document.createElement('h4');
    price.classList.add('price');
    price.textContent = product.price;

    const description = document.createElement('p');
    description.classList.add('description');
    description.textContent = product.description;

    const button = document.createElement('button');
    button.classList.add('add-to-cart');
    button.textContent = '+';

    button.addEventListener('click', () => {
        addToCart(product.id); // Appeler la fonction addToCart avec l'ID du produit
    });

    card.appendChild(img);
    card.appendChild(title);
    card.appendChild(price);
    card.appendChild(description);
    card.appendChild(button);

    return card; // Return the complete card
}

// Display products
function displayProducts(products) {
    const productContainer = document.querySelector('.product-content');
    productContainer.innerHTML = ''; // Clear existing products

    products.forEach(product => {
        const productCard = createProductCard(product);
        productContainer.appendChild(productCard);
    });
}
function displayCartItems(products) {
    const cartContainer = document.getElementById('cart-items');
    cartContainer.innerHTML = ''; // Vider le contenu actuel

    products.forEach(product => {
        const productRow = createCartItemRow(product);
        cartContainer.appendChild(productRow);
    });

    // Mettre à jour le total
    updateTotalAmount(products);
}


// Switch to grid view
// Switch to grid view
function setGridView() {
    const productContainer = document.querySelector('.product-content');
    productContainer.classList.remove('list-view');
    productContainer.classList.add('grid-view');

    const cards = document.querySelectorAll('.product-card');
    cards.forEach(card => {
        card.classList.remove('list-item');
    });
}

// Switch to list view
function setListView() {
    const productContainer = document.querySelector('.product-content');
    productContainer.classList.remove('grid-view');
    productContainer.classList.add('list-view');

    const cards = document.querySelectorAll('.product-card');
    cards.forEach(card => {
        card.classList.add('list-item');
    });
}


// Add event listeners for grid and list icons
document.getElementById('grid').addEventListener('click', setGridView);
document.getElementById('list').addEventListener('click', setListView);

// Filter products based on search input
function filterProducts() {
    const query = document.getElementById('search-input').value.toLowerCase();
    const filteredProducts = products.filter(product =>
        product.name.toLowerCase().includes(query) ||
        product.description.toLowerCase().includes(query)
    );
    displayProducts(filteredProducts);
}

// Event listeners
document.addEventListener('DOMContentLoaded', getProducts);
document.getElementById('search-input').addEventListener('input', filterProducts);