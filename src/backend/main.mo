import Map "mo:core/Map";
import Iter "mo:core/Iter";
import Nat "mo:core/Nat";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Array "mo:core/Array";
import Float "mo:core/Float";

import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";

import Storage "blob-storage/Storage";

import AccessControl "authorization/access-control";
import MixinStorage "blob-storage/Mixin";
import MixinAuthorization "authorization/MixinAuthorization";

actor {
  include MixinStorage();

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  type UserRole = AccessControl.UserRole;

  public type UserProfile = {
    name : Text;
  };

  public type StoreHours = {
    monday : Text;
    tuesday : Text;
    wednesday : Text;
    thursday : Text;
    friday : Text;
    saturday : Text;
    sunday : Text;
  };

  public type Coordinates = {
    latitude : Float;
    longitude : Float;
  };

  public type StoreDetails = {
    name : Text;
    banner : ?Storage.ExternalBlob;
    address : Text;
    phone : Text;
    whatsapp : Text;
    email : Text;
    storeHours : StoreHours;
    coordinates : Coordinates;
    createdDate : ?Time.Time;
    lastUpdatedDate : ?Time.Time;
  };

  public type Category = {
    id : Nat;
    name : Text;
    order : Nat;
    createdDate : Time.Time;
    lastUpdatedDate : Time.Time;
  };

  public type Product = {
    barcode : Text;
    name : Text;
    categoryId : Nat;
    description : ?Text;
    inStock : Bool;
    photo : ?Storage.ExternalBlob;
    isFeatured : Bool;
    createdDate : ?Time.Time;
    lastUpdatedDate : ?Time.Time;
  };

  public type PaginatedProducts = {
    products : [Product];
    totalCount : Nat;
    currentPage : Nat;
    totalPages : Nat;
    pageSize : Nat;
  };

  public type ProductSearchCriteria = {
    searchBy : ?Text;
    searchValue : ?Text;
    categoryId : ?Nat;
    featuredOnly : ?Bool;
    featuredFirst : ?Bool;
  };

  public type ProductSearchResults = {
    products : [Product];
    totalCount : Nat;
    totalPages : Nat;
  };

  public type PaginatedCategories = {
    categories : [Category];
    totalCount : Nat;
    hasMore : Bool;
  };

  public type CategoryWithProducts = {
    category : Category;
    products : [Product];
    productCount : Nat;
  };

  public type UserRoleInfo = {
    principal : Text;
    role : Text;
  };

  let categories = Map.empty<Nat, Category>();
  let products = Map.empty<Text, Product>();

  let userProfiles = Map.empty<Principal, UserProfile>();

  var nextCategoryId = 2_000;
  var storeDetails : StoreDetails = {
    name = "AFTAB RETAIL";
    banner = null;
    address = "C. Albertillas, 5, LOCAL, 29003 Málaga";
    phone = "952233833";
    whatsapp = "695250655";
    email = "aldolocutoriomalaga@gmail.com";
    storeHours = {
      monday = "09:30 – 14:00, 17:00 – 22:00";
      tuesday = "09:30 – 14:00, 17:00 – 22:00";
      wednesday = "09:30 – 14:00, 17:00 – 22:00";
      thursday = "09:30 – 14:00, 17:00 – 22:00";
      friday = "09:30 – 14:00, 17:00 – 22:00";
      saturday = "10:00 – 14:00";
      sunday = "Closed";
    };
    coordinates = {
      latitude = 36.69699092702079;
      longitude = -4.447439687321973;
    };
    createdDate = null;
    lastUpdatedDate = null;
  };

  // CRUD USERS

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // ADMIN USER ROLE MANAGEMENT

  public query ({ caller }) func getAllUserRoles() : async [UserRoleInfo] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view user roles");
    };
    [];
  };

  public shared ({ caller }) func assignUserRole(principalText : Text, roleText : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can assign user roles");
    };
    let userPrincipal = Principal.fromText(principalText);

    let role : UserRole = switch (roleText) {
      case ("admin") { #admin };
      case ("user") { #user };
      case ("guest") { #guest };
      case (_) { Runtime.trap("Invalid role specified") };
    };

    AccessControl.assignRole(accessControlState, caller, userPrincipal, role);
  };

  public shared ({ caller }) func removeAdminRole(principalText : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can remove admin roles");
    };

    let userPrincipal = Principal.fromText(principalText);
    AccessControl.assignRole(accessControlState, caller, userPrincipal, #user);
  };

  // CATEGORY MANAGEMENT

  public shared ({ caller }) func addCategory(name : Text, order : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can add categories");
    };

    let currentTime = Time.now();
    let categoryId = nextCategoryId;
    nextCategoryId += 1;

    let newCategory : Category = {
      id = categoryId;
      name;
      order;
      createdDate = currentTime;
      lastUpdatedDate = currentTime;
    };

    categories.add(categoryId, newCategory);
  };

  public query ({ caller }) func getAllCategories() : async [Category] {
    categories.values().toArray();
  };

  public query ({ caller }) func getCategoriesPaginated(offset : Nat, limit : Nat) : async PaginatedCategories {
    let allCategories = categories.values().toArray();

    let sortedCategories = allCategories.sort(
      func(a : Category, b : Category) : { #less; #equal; #greater } {
        if (a.order < b.order) { #less } else if (a.order > b.order) { #greater } else { #equal };
      }
    );

    let totalCount = sortedCategories.size();
    let endIndex = if (offset + limit > totalCount) { totalCount } else { offset + limit };
    let paginatedCategories = sortedCategories.sliceToArray(offset, endIndex);
    let hasMore = endIndex < totalCount;

    {
      categories = paginatedCategories;
      totalCount;
      hasMore;
    };
  };

  public query ({ caller }) func getCategoriesWithProducts(offset : Nat, limit : Nat) : async [CategoryWithProducts] {
    let allCategories = categories.values().toArray();

    let sortedCategories = allCategories.sort(
      func(a : Category, b : Category) : { #less; #equal; #greater } {
        if (a.order < b.order) { #less } else if (a.order > b.order) { #greater } else { #equal };
      }
    );

    let totalCount = sortedCategories.size();
    let endIndex = if (offset + limit > totalCount) { totalCount } else { offset + limit };
    let paginatedCategories = sortedCategories.sliceToArray(offset, endIndex);

    let categoriesWithProducts = paginatedCategories.map(
      func(category : Category) : CategoryWithProducts {
        let categoryProducts = products.values().toArray().filter(
          func(product : Product) : Bool {
            product.categoryId == category.id;
          }
        );

        let sortedProducts = categoryProducts.sort(
          func(a : Product, b : Product) : { #less; #equal; #greater } {
            if (a.isFeatured and not b.isFeatured) {
              #less;
            } else if (not a.isFeatured and b.isFeatured) {
              #greater;
            } else {
              switch (a.lastUpdatedDate, b.lastUpdatedDate) {
                case (?aTime, ?bTime) {
                  if (aTime > bTime) { #less } else if (aTime < bTime) { #greater } else { #equal };
                };
                case (?_, null) { #less };
                case (null, ?_) { #greater };
                case (null, null) { #equal };
              };
            };
          }
        );

        let limitedProducts = sortedProducts.sliceToArray(0, Nat.min(sortedProducts.size(), 5));
        {
          category;
          products = limitedProducts;
          productCount = categoryProducts.size();
        };
      }
    );

    categoriesWithProducts;
  };

  public query ({ caller }) func getCategoryById(categoryId : Nat) : async ?Category {
    categories.get(categoryId);
  };

  public shared ({ caller }) func updateCategory(id : Nat, name : Text, order : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update categories");
    };

    switch (categories.get(id)) {
      case (null) { Runtime.trap("Category not found") };
      case (?existingCategory) {
        let updatedCategory : Category = {
          id = existingCategory.id;
          name;
          order;
          createdDate = existingCategory.createdDate;
          lastUpdatedDate = Time.now();
        };
        categories.add(id, updatedCategory);
      };
    };
  };

  public shared ({ caller }) func deleteCategory(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete categories");
    };

    if (categories.get(id) == null) {
      Runtime.trap("Category not found");
    };

    let hasProducts = products.values().any(
      func(product) {
        product.categoryId == id;
      }
    );

    if (hasProducts) {
      Runtime.trap("Cannot delete category with associated products");
    };

    categories.remove(id);
  };

  public shared ({ caller }) func reorderCategory(id : Nat, newOrder : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can reorder categories");
    };

    switch (categories.get(id)) {
      case (null) { Runtime.trap("Category not found") };
      case (?existingCategory) {
        let updatedCategory : Category = {
          id = existingCategory.id;
          name = existingCategory.name;
          order = newOrder;
          createdDate = existingCategory.createdDate;
          lastUpdatedDate = Time.now();
        };
        categories.add(id, updatedCategory);
      };
    };
  };

  // PRODUCT MANAGEMENT

  public shared ({ caller }) func addProduct(
    barcode : Text,
    name : Text,
    categoryId : Nat,
    description : ?Text,
    inStock : Bool,
    photo : ?Storage.ExternalBlob,
    isFeatured : Bool,
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can add products");
    };

    if (categories.get(categoryId) == null) {
      Runtime.trap("Category not found");
    };

    let newProduct : Product = {
      barcode;
      name;
      categoryId;
      description;
      inStock;
      photo;
      isFeatured;
      createdDate = ?Time.now();
      lastUpdatedDate = ?Time.now();
    };

    products.add(barcode, newProduct);
  };

  public query ({ caller }) func getProducts(
    page : Nat,
    pageSize : Nat,
    search : Text,
    categoryId : ?Nat,
    featuredOnly : ?Bool,
    featuredFirst : ?Bool,
  ) : async PaginatedProducts {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can access product management");
    };

    let isBarcodeSearch = search.size() > 0 and search.toArray().all(
      func(c) { c >= '0' and c <= '9' }
    );

    let searchLower = search.toLower();

    let filteredProducts = products.values().toArray().filter(
      func(product) {
        let matchesSearch = if (isBarcodeSearch) {
          product.barcode == search;
        } else {
          let barcodeLower = product.barcode.toLower();
          let nameLower = product.name.toLower();
          barcodeLower.contains(#text searchLower) or nameLower.contains(#text searchLower);
        };

        let matchesCategory = switch (categoryId) {
          case (null) { true };
          case (?id) { product.categoryId == id };
        };

        let matchesFeatured = switch (featuredOnly) {
          case (null) { true };
          case (?true) { product.isFeatured };
          case (?false) { true };
        };

        matchesSearch and matchesCategory and matchesFeatured;
      }
    );

    let sortedProducts = switch (featuredFirst) {
      case (?true) {
        filteredProducts.sort(
          func(a, b) {
            if (a.isFeatured and not b.isFeatured) {
              #less;
            } else if (not a.isFeatured and b.isFeatured) {
              #greater;
            } else {
              #equal;
            };
          }
        );
      };
      case (_) { filteredProducts };
    };

    let totalCount = sortedProducts.size();
    let totalPages = if (totalCount == 0) { 1 } else { (totalCount - 1) / pageSize + 1 };
    let clampedPage = if (page >= totalPages) { totalPages - 1 } else { page };
    let startIndex = clampedPage * pageSize;
    let endIndex = if (startIndex + pageSize > totalCount) { totalCount } else {
      startIndex + pageSize;
    };

    let paginatedProducts = sortedProducts.sliceToArray(startIndex, endIndex);

    {
      products = paginatedProducts;
      totalCount;
      currentPage = clampedPage;
      totalPages;
      pageSize;
    };
  };

  public shared ({ caller }) func updateProduct(
    barcode : Text,
    name : Text,
    categoryId : Nat,
    description : ?Text,
    inStock : Bool,
    photo : ?Storage.ExternalBlob,
    isFeatured : Bool,
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update products");
    };

    switch (products.get(barcode)) {
      case (null) {
        Runtime.trap("Product not found");
      };
      case (?existingProduct) {
        let updatedProduct : Product = {
          barcode = existingProduct.barcode;
          name;
          categoryId;
          description;
          inStock;
          photo = switch (photo) {
            case (?somePhoto) { ?somePhoto };
            case (null) { existingProduct.photo };
          };
          isFeatured;
          createdDate = existingProduct.createdDate;
          lastUpdatedDate = ?Time.now();
        };
        products.add(barcode, updatedProduct);
      };
    };
  };

  public shared ({ caller }) func deleteProduct(barcode : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete products");
    };

    switch (products.get(barcode)) {
      case (null) {
        Runtime.trap("Product not found");
      };
      case (?_) {
        products.remove(barcode);
      };
    };
  };

  public shared ({ caller }) func toggleStock(barcode : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can toggle stock status");
    };

    switch (products.get(barcode)) {
      case (null) {
        Runtime.trap("Product not found");
      };
      case (?existingProduct) {
        let toggledProduct : Product = {
          barcode = existingProduct.barcode;
          name = existingProduct.name;
          categoryId = existingProduct.categoryId;
          description = existingProduct.description;
          inStock = not existingProduct.inStock;
          photo = existingProduct.photo;
          isFeatured = existingProduct.isFeatured;
          createdDate = existingProduct.createdDate;
          lastUpdatedDate = ?Time.now();
        };
        products.add(barcode, toggledProduct);
      };
    };
  };

  public query ({ caller }) func getProduct(barcode : Text) : async ?Product {
    products.get(barcode);
  };

  public query ({ caller }) func getProductsByCategory(
    categoryId : Nat,
    featuredOnly : ?Bool,
  ) : async [Product] {
    let filteredProducts = products.values().toArray().filter(
      func(product) {
        let matchesCategory = product.categoryId == categoryId;
        let matchesFeatured = switch (featuredOnly) {
          case (null) { true };
          case (?true) { product.isFeatured };
          case (?false) { not product.isFeatured };
        };
        matchesCategory and matchesFeatured;
      }
    );

    let sortedProducts = filteredProducts.sort(
      func(a : Product, b : Product) : { #less; #equal; #greater } {
        if (a.isFeatured and not b.isFeatured) {
          #less;
        } else if (not a.isFeatured and b.isFeatured) {
          #greater;
        } else {
          switch (a.lastUpdatedDate, b.lastUpdatedDate) {
            case (?aTime, ?bTime) {
              if (aTime > bTime) { #less } else if (aTime < bTime) { #greater } else { #equal };
            };
            case (?_, null) { #less };
            case (null, ?_) { #greater };
            case (null, null) { #equal };
          };
        };
      }
    );

    sortedProducts;
  };

  public query ({ caller }) func getCategoryProductsPaginated(
    categoryId : Nat,
    offset : Nat,
    limit : Nat,
    featuredOnly : ?Bool,
  ) : async { products : [Product]; totalCount : Nat } {
    let filteredProducts = products.values().toArray().filter(
      func(product) {
        let matchesCategory = product.categoryId == categoryId;
        let matchesFeatured = switch (featuredOnly) {
          case (null) { true };
          case (?true) { product.isFeatured };
          case (?false) { not product.isFeatured };
        };
        matchesCategory and matchesFeatured;
      }
    );

    let sortedProducts = filteredProducts.sort(
      func(a : Product, b : Product) : { #less; #equal; #greater } {
        if (a.isFeatured and not b.isFeatured) {
          #less;
        } else if (not a.isFeatured and b.isFeatured) {
          #greater;
        } else {
          switch (a.lastUpdatedDate, b.lastUpdatedDate) {
            case (?aTime, ?bTime) {
              if (aTime > bTime) { #less } else if (aTime < bTime) { #greater } else { #equal };
            };
            case (?_, null) { #less };
            case (null, ?_) { #greater };
            case (null, null) { #equal };
          };
        };
      }
    );

    let totalCount = sortedProducts.size();
    let endIndex = if (offset + limit > totalCount) { totalCount } else { offset + limit };
    let paginatedProducts = sortedProducts.sliceToArray(offset, endIndex);

    {
      products = paginatedProducts;
      totalCount;
    };
  };

  public query ({ caller }) func getFeaturedProducts(
    offset : Nat,
    limit : Nat,
  ) : async { products : [Product]; totalCount : Nat } {
    let featuredProducts = products.values().toArray().reverse().filter(
      func(product) {
        product.isFeatured;
      }
    );

    let totalCount = featuredProducts.size();
    let endIndex = if (offset + limit > totalCount) { totalCount } else {
      offset + limit;
    };
    let paginatedProducts = featuredProducts.sliceToArray(offset, endIndex);

    {
      products = paginatedProducts;
      totalCount;
    };
  };

  public shared ({ caller }) func updateProductFeaturedStatus(
    barcode : Text,
    isFeatured : Bool,
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update product featured status");
    };

    switch (products.get(barcode)) {
      case (null) {
        Runtime.trap("Product not found");
      };
      case (?existingProduct) {
        let updatedProduct : Product = {
          barcode = existingProduct.barcode;
          name = existingProduct.name;
          categoryId = existingProduct.categoryId;
          description = existingProduct.description;
          inStock = existingProduct.inStock;
          photo = existingProduct.photo;
          isFeatured;
          createdDate = existingProduct.createdDate;
          lastUpdatedDate = ?Time.now();
        };
        products.add(barcode, updatedProduct);
      };
    };
  };

  // IMPORT OPERATIONS

  public shared ({ caller }) func importProducts(importedProducts : [Product]) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can import products");
    };

    for (importedProduct in importedProducts.values()) {
      switch (products.get(importedProduct.barcode)) {
        case (null) {
          let newProduct : Product = {
            barcode = importedProduct.barcode;
            name = importedProduct.name;
            categoryId = importedProduct.categoryId;
            description = importedProduct.description;
            inStock = importedProduct.inStock;
            photo = null;
            isFeatured = false;
            createdDate = ?Time.now();
            lastUpdatedDate = ?Time.now();
          };
          products.add(importedProduct.barcode, newProduct);
        };
        case (?existingProduct) {
          let updatedProduct : Product = {
            barcode = existingProduct.barcode;
            name = importedProduct.name;
            categoryId = importedProduct.categoryId;
            description = importedProduct.description;
            inStock = importedProduct.inStock;
            photo = existingProduct.photo;
            isFeatured = existingProduct.isFeatured;
            createdDate = existingProduct.createdDate;
            lastUpdatedDate = ?Time.now();
          };
          products.add(importedProduct.barcode, updatedProduct);
        };
      };
    };
  };

  public shared ({ caller }) func bulkImportCategories(categoriesToImport : [Category]) : async {
    imported : Nat;
    skipped : Nat;
    errors : [Text];
  } {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can bulk import categories");
    };

    var imported = 0;
    var skipped = 0;
    var errorMessages : [Text] = [];

    for (category in categoriesToImport.values()) {
      if (categories.get(category.id) == null) {
        categories.add(category.id, category);
        imported += 1;
      } else {
        skipped += 1;
        errorMessages := errorMessages.concat(["Category with ID " # debug_show (category.id) # " already exists"]);
      };
    };

    let maxId = categoriesToImport.foldLeft(
      0,
      func(acc, category) {
        if (category.id > acc) { category.id } else { acc };
      },
    );
    if (maxId >= nextCategoryId) {
      nextCategoryId := maxId + 1;
    };

    {
      imported;
      skipped;
      errors = errorMessages;
    };
  };

  // UTILITY OPERATIONS

  public shared ({ caller }) func updateCategoryId(oldCategoryId : Nat, newCategoryId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update category IDs");
    };

    if (categories.get(newCategoryId) == null) {
      Runtime.trap("New category not found");
    };

    for ((barcode, product) in products.entries()) {
      if (product.categoryId == oldCategoryId) {
        let updatedProduct : Product = {
          barcode = product.barcode;
          name = product.name;
          categoryId = newCategoryId;
          description = product.description;
          inStock = product.inStock;
          photo = product.photo;
          isFeatured = product.isFeatured;
          createdDate = product.createdDate;
          lastUpdatedDate = ?Time.now();
        };
        products.add(barcode, updatedProduct);
      };
    };
  };

  public shared ({ caller }) func toggleCategoryActivation(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can toggle category activation");
    };

    switch (categories.get(id)) {
      case (null) { Runtime.trap("Category not found") };
      case (?existingCategory) {
        let updatedCategory : Category = {
          id = existingCategory.id;
          name = existingCategory.name;
          order = existingCategory.order;
          createdDate = existingCategory.createdDate;
          lastUpdatedDate = Time.now();
        };
        categories.add(id, updatedCategory);
      };
    };
  };

  // STORE DETAILS MANAGEMENT

  public query ({ caller }) func getStoreDetails() : async StoreDetails {
    storeDetails;
  };

  public shared ({ caller }) func createStoreDetails(
    name : Text,
    banner : ?Storage.ExternalBlob,
    address : Text,
    phone : Text,
    whatsapp : Text,
    email : Text,
    storeHours : StoreHours,
    coordinates : Coordinates,
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can create store details");
    };

    if (storeDetails.name != "AFTAB RETAIL" or
        storeDetails.address != "C. Albertillas, 5, LOCAL, 29003 Málaga" or
        storeDetails.phone != "952233833" or
        storeDetails.whatsapp != "695250655" or
        storeDetails.email != "aldolocutoriomalaga@gmail.com") {
      Runtime.trap("Store details already exist. Use updateStoreDetails instead.");
    };

    let currentTime = Time.now();
    let newStoreDetails : StoreDetails = {
      name;
      banner;
      address;
      phone;
      whatsapp;
      email;
      storeHours;
      coordinates;
      createdDate = ?currentTime;
      lastUpdatedDate = ?currentTime;
    };

    storeDetails := newStoreDetails;
  };

  public shared ({ caller }) func updateStoreDetails(
    name : Text,
    banner : ?Storage.ExternalBlob,
    address : Text,
    phone : Text,
    whatsapp : Text,
    email : Text,
    storeHours : StoreHours,
    coordinates : Coordinates,
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update store details");
    };

    let currentTime = Time.now();
    let updatedStoreDetails : StoreDetails = {
      name;
      banner;
      address;
      phone;
      whatsapp;
      email;
      storeHours;
      coordinates;
      createdDate = switch (storeDetails.createdDate) {
        case (null) { ?currentTime };
        case (_currentDate) { storeDetails.createdDate };
      };
      lastUpdatedDate = ?currentTime;
    };

    storeDetails := updatedStoreDetails;
  };

  public query ({ caller }) func searchProducts(criteria : ProductSearchCriteria) : async ProductSearchResults {
    let isBarcodeSearch = switch (criteria.searchValue) {
      case (null) { false };
      case (?searchValue) {
        searchValue.size() > 0 and searchValue.toArray().all(
          func(c) { c >= '0' and c <= '9' }
        );
      };
    };

    let emptyOrNull = func(t : ?Text) : Bool {
      switch (t) {
        case (null) { true };
        case (?text) { text.trim(#char ' ') == "" };
      }
    };

    let filteredProducts = products.values().toArray().filter(
      func(product) {
        let matchesSearch = switch (criteria.searchBy, criteria.searchValue) {
          case (null, _) { true };
          case (_, null) { true };
          case (?searchBy, ?searchValue) {
            if (emptyOrNull(?searchValue)) {
              true;
            } else if (isBarcodeSearch) {
              product.barcode == searchValue
            } else {
              let searchLower = searchValue.toLower();
              switch (searchBy) {
                case ("barcode") {
                  product.barcode.toLower().contains(#text searchLower);
                };
                case ("name") {
                  let nameMatch = product.name.toLower().contains(#text searchLower);
                  let descriptionMatch = switch (product.description) {
                    case (null) { false };
                    case (?desc) {
                      desc.toLower().contains(#text searchLower);
                    };
                  };
                  nameMatch or descriptionMatch;
                };
                case ("description") {
                  let descriptionMatch = switch (product.description) {
                    case (null) { false };
                    case (?desc) {
                      desc.toLower().contains(#text searchLower);
                    };
                  };
                  descriptionMatch;
                };
                case (_) { false };
              };
            };
          };
        };

        let matchesCategory = switch (criteria.categoryId) {
          case (null) { true };
          case (?id) { product.categoryId == id };
        };

        let matchesFeatured = switch (criteria.featuredOnly) {
          case (null) { true };
          case (?true) { product.isFeatured };
          case (?false) { true };
        };

        matchesSearch and matchesCategory and matchesFeatured;
      }
    );

    let sortedProducts = switch (criteria.featuredFirst) {
      case (?true) {
        filteredProducts.sort(
          func(a, b) {
            if (a.isFeatured and not b.isFeatured) {
              #less;
            } else if (not a.isFeatured and b.isFeatured) {
              #greater;
            } else {
              #equal;
            };
          }
        );
      };
      case (_) { filteredProducts };
    };

    let totalCount = sortedProducts.size();
    let pageSize = 10;
    let totalPages = if (totalCount == 0) { 1 } else { (totalCount - 1) / pageSize + 1 };

    let limitedProducts = sortedProducts.sliceToArray(0, Nat.min(sortedProducts.size(), pageSize));

    {
      products = limitedProducts;
      totalCount;
      totalPages;
    };
  };
};
