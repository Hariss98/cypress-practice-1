describe("NopCommerce test", () => {
  //In order to actually store something in the Cart throughout tests we need to disable the default behavior of clearing Cookies after every test in Cypress
  beforeEach(() => {
    Cypress.Cookies.defaults({
      preserve: (cookie) => {
        return true;
      },
    });
  });

  //Variables which will be used throughout the Code
  var deviceDisplayName = "";
  var price = 0;
  var deviceQuantity = Math.floor(Math.random() * 9) + 1;

  //  describe('Visit home Page', () => {

  //Loads the URL given in fixtures/data.json
  //it("Load page", () => {
  //cy.fixture("data.json").then((data) => {
  //  cy.visit(data.url);
  // });
  //});

  it("Assure the URL is correct", () => {
    cy.url().should("equal", "https://demo.nopcommerce.com/");
  });

  //})

  describe("Test search functionalities", () => {
    it("Type a not existing item in search bar", () => {
      cy.get("#small-searchterms").type("Not existing item");
    });

    it("Click search button", () => {
      cy.get("#small-search-box-form > .button-1").click();
    });

    it("Assure no results found message is displayed", () => {
      cy.get(".no-result").then(($div) => {
        expect($div.text()).to.contain(
          "No products were found that matched your criteria."
        );
      });
    });

    //Uses devices from fixtures/data.json
    it("Type Search term in Search bar", () => {
      cy.fixture("data.json").then((data) => {
        cy.get("#small-searchterms").type(data.devices.device1);
      });
    });

    it("Click search button", () => {
      cy.get("#small-search-box-form > .button-1").click();
    });

    //If the name of the item from data.json is the same to the one on this view component then the item is found
    it("Assure item is found", () => {
      cy.fixture("data.json").then((data) => {
        cy.get(
          ":nth-child(1) > .product-item > .details > .product-title > a"
        ).then(($a) => {
          expect($a.text()).to.equal(data.devices.device1);
        });
      });
    });

    //Making sure the query parameters are set correctly in the url
    it("Assure the URL is correct", () => {
      cy.fixture("data.json").then((data) => {
        var deviceName = "";
        deviceName = data.devices.device1;
        deviceName = deviceName.replace(/\s+/g, "+");

        cy.url().should("equal", data.url + "search?q=" + deviceName);
      });
    });
  });

  describe("Product page check", () => {
    it("Click on Product link and open Product page", () => {
      cy.get(
        ":nth-child(1) > .product-item > .details > .product-title > a"
      ).click();
    });

    //Making sure the query parameters are set correctly in the url
    it("Assure the URL is correct", () => {
      cy.fixture("data.json").then((data) => {
        var deviceName = "";
        deviceName = data.devices.device1;
        deviceName = deviceName.replace(/\s+/g, "-").toLowerCase();

        cy.url().should("equal", data.url + deviceName);
      });
    });

    it("Select item quantity", () => {
      cy.get("#product_enteredQuantity_14")
        .click()
        .clear()
        .type(deviceQuantity);
    });

    it("Add item to Cart", () => {
      //Aliasing adding product to cart POST request in order to wait for its resolve below
      cy.server()
        .route(
          "POST",
          "https://demo.nopcommerce.com/addproducttocart/details/*/*"
        )
        .as("addProductToCart");

      cy.get("#add-to-cart-button-14")
        .click()
        .wait("@addProductToCart")
        .its("status")
        .should("eq", 200);

      //Giving global variable deviceDisplayName the value of this item as we have " - Black" color description extension on this article
      cy.get(
        'div[data-productid="14"] > .variant-overview > .variant-name'
      ).then(($div) => {
        deviceDisplayName = $div.text();
      });

      //Saving item price to compare with cart total in the end, parsing to INT due to all test items having rounded price values. Real case scenario is to parse the value to float and continue with it
      cy.get("#price-value-14").then(($span) => {
        price = parseInt($span.text().split("$")[1].toString());
        console.log("PRICE: " + price);
      });
    });

    it("Banner visible with correct text and background color", () => {
      var bannerText = "The product has been added to your shopping cart";

      cy.get(".bar-notification.success")
        .should("be.visible")
        .should("have.css", "background-color")
        .and("equal", "rgb(75, 176, 122)");

      cy.get(".content").then(($p) => {
        expect($p.text()).to.equal(bannerText);
      });
    });

    it("Close Banner", () => {
      cy.get(".close").click();
    });
  });

  describe("Check Shopping cart Drop Down properties", () => {
    it("Assure Banner is not visible", () => {
      cy.get(".bar-notification").should("not.exist");
    });

    it("Open drop down menu", () => {
      cy.get("#topcartlink").trigger("mouseover");
    });

    it("Assure Drop down is open", () => {
      cy.get(".mini-shopping-cart").should("exist");
    });

    it("Assure correct item is added", () => {
      cy.get(".name > a").then(($a) => {
        expect($a.text()).to.equal(deviceDisplayName);
      });
    });
    it("Assure correct Item Price is displayed", () => {
      cy.get(".price > span").then(($span) => {
        expect(
          parseInt($span.text().split("$")[1].toString().replace(",", ""))
        ).to.equal(price);
      });
    });

    it("Assure correct Quantity is displayed", () => {
      cy.get(".quantity > span").then(($span) => {
        expect(parseInt($span.text())).to.equal(deviceQuantity);
      });
    });

    it("Assure correct Total item price is displayed", () => {
      cy.get(".totals > strong").then(($strong) => {
        expect(
          parseInt($strong.text().split("$")[1].toString().replace(",", ""))
        ).to.equal(price * deviceQuantity);
      });
    });
  });

  describe("Shopping Cart check", () => {
    it("Open Shopping Cart", () => {
      cy.get("#topcartlink").click();
    });

    it("Assure the URL is correct", () => {
      cy.fixture("data.json").then((data) => {
        cy.url().should("equal", data.url + "cart");
      });
    });

    it("Assure item is in Cart", () => {
      cy.get(".product-name").then(($a) => {
        expect($a.text()).to.equal(deviceDisplayName);
      });
    });

    it("Assure correct Item Price is displayed", () => {
      cy.get(".product-unit-price").then(($span) => {
        var itemPrice = 0;
        itemPrice = parseInt(
          $span.text().split("$")[1].toString().replace(",", "")
        );
        expect(itemPrice).to.equal(price);
      });
    });

    it("Assure correct Quantity is displayed", () => {
      cy.get("tbody > tr > .quantity > .qty-input")
        .invoke("val")
        .then((quantity) => {
          expect(parseInt(quantity)).to.eq(deviceQuantity);
        });
    });

    it("Assure correct Total item price is displayed", () => {
      var result = 0;

      cy.get(".product-unit-price").then(($span) => {
        var itemPrice = 0;
        itemPrice = parseInt(
          $span.text().split("$")[1].toString().replace(",", "")
        );
        cy.get("tbody > tr > .quantity > .qty-input")
          .invoke("val")
          .then((quantity) => {
            result = itemPrice * parseInt(quantity);
          });
      });

      cy.get(".product-subtotal").then(($span) => {
        var total = 0;
        total = parseInt(
          $span.text().split("$")[1].toString().replace(",", "")
        );
        expect(total).to.equal(result);
      });
    });
  });

  //Clearing the Shopping Cart in order to return the selection to zero in order to avoid clashes with data between test runs
  describe("Clear Shopping Cart", () => {
    it("Remove item from Cart", () => {
      cy.get("tbody > tr > .remove-from-cart").click();
    });

    skip.it("Remove item from Cart", () => {
      cy.get("tbody > tr > .remove-from-cart").click();
    });

    it("Assure Shopping Cart is Empty", () => {
      cy.get(".no-data").then(($div) => {
        expect($div.text()).to.include("Your Shopping Cart is empty!");
      });
    });
  });
});

import HomePage from "../nocomers.js/homepage.js";

describe("Visit home Page", () => {
  it("Load page", () => {
    HomePage.loadPage();
  });

  it("Assure the URL is correct", () => {
    HomePage.verifyURL();
  });
});
