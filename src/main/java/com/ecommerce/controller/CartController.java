package com.ecommerce.controller;

import com.ecommerce.dto.CartRequest;
import com.ecommerce.model.CartItem;
import com.ecommerce.model.Product;
import com.ecommerce.model.User;
import com.ecommerce.service.CartService;
import com.ecommerce.service.ProductService;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.util.*;

@RestController
@RequestMapping("/api/cart")
public class CartController {

    private final CartService cartService;
    private final ProductService productService;

    public CartController(CartService cartService, ProductService productService) {
        this.cartService = cartService;
        this.productService = productService;
    }

    private List<Map<String, Object>> serializeCart(List<CartItem> cartItems) {
        List<Map<String, Object>> serialized = new ArrayList<>();
        if (cartItems == null) {
            return serialized;
        }
        for (CartItem item : cartItems) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", item.getId());
            map.put("productId", item.getProduct().getId());
            map.put("productName", item.getProduct().getName());
            map.put("price", item.getProduct().getPrice());
            map.put("imageUrl", item.getProduct().getImageUrl());
            map.put("quantity", item.getQuantity());
            map.put("stock", item.getProduct().getStockQuantity());
            
            BigDecimal subtotal = item.getProduct().getPrice().multiply(BigDecimal.valueOf(item.getQuantity()));
            map.put("subtotal", subtotal);
            serialized.add(map);
        }
        return serialized;
    }

    @GetMapping
    public ResponseEntity<?> getCart(HttpSession session) {
        User user = (User) session.getAttribute("currentUser");
        if (user != null) {
            List<CartItem> items = cartService.getCartItems(user);
            return ResponseEntity.ok(serializeCart(items));
        } else {
            @SuppressWarnings("unchecked")
            List<CartItem> guestCart = (List<CartItem>) session.getAttribute("guestCart");
            if (guestCart == null) {
                guestCart = new ArrayList<>();
            }
            return ResponseEntity.ok(serializeCart(guestCart));
        }
    }

    @PostMapping("/add")
    public ResponseEntity<?> addToCart(@Valid @RequestBody CartRequest request, HttpSession session) {
        User user = (User) session.getAttribute("currentUser");
        if (user != null) {
            try {
                cartService.addToCart(user, request.getProductId(), request.getQuantity());
                return getCart(session);
            } catch (Exception e) {
                return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
            }
        } else {
            Product product = productService.getProductById(request.getProductId())
                    .orElseThrow(() -> new IllegalArgumentException("Product not found"));

            if (product.getStockQuantity() < request.getQuantity()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Insufficient stock"));
            }

            @SuppressWarnings("unchecked")
            List<CartItem> guestCart = (List<CartItem>) session.getAttribute("guestCart");
            if (guestCart == null) {
                guestCart = new ArrayList<>();
            }

            boolean found = false;
            for (CartItem item : guestCart) {
                if (item.getProduct().getId().equals(product.getId())) {
                    int newQty = item.getQuantity() + request.getQuantity();
                    if (product.getStockQuantity() < newQty) {
                        return ResponseEntity.badRequest().body(Map.of("error", "Insufficient stock"));
                    }
                    item.setQuantity(newQty);
                    found = true;
                    break;
                }
            }

            if (!found) {
                CartItem newItem = new CartItem(null, product, request.getQuantity());
                // Set a temporary random negative ID for guest items to track them in UI
                newItem.setId(new Random().nextLong() * -1);
                guestCart.add(newItem);
            }

            session.setAttribute("guestCart", guestCart);
            return getCart(session);
        }
    }

    @PutMapping("/update/{id}")
    public ResponseEntity<?> updateCartItem(
            @PathVariable("id") Long productId,
            @RequestBody Map<String, Integer> payload,
            HttpSession session) {
        
        Integer quantity = payload.get("quantity");
        if (quantity == null || quantity < 1) {
            return ResponseEntity.badRequest().body(Map.of("error", "Quantity must be at least 1"));
        }

        User user = (User) session.getAttribute("currentUser");
        if (user != null) {
            try {
                cartService.updateQuantity(user, productId, quantity);
                return getCart(session);
            } catch (Exception e) {
                return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
            }
        } else {
            @SuppressWarnings("unchecked")
            List<CartItem> guestCart = (List<CartItem>) session.getAttribute("guestCart");
            if (guestCart != null) {
                for (CartItem item : guestCart) {
                    if (item.getProduct().getId().equals(productId)) {
                        if (item.getProduct().getStockQuantity() < quantity) {
                            return ResponseEntity.badRequest().body(Map.of("error", "Insufficient stock"));
                        }
                        item.setQuantity(quantity);
                        break;
                    }
                }
                session.setAttribute("guestCart", guestCart);
            }
            return getCart(session);
        }
    }

    @DeleteMapping("/remove/{id}")
    public ResponseEntity<?> removeCartItem(@PathVariable("id") Long productId, HttpSession session) {
        User user = (User) session.getAttribute("currentUser");
        if (user != null) {
            try {
                cartService.removeFromCart(user, productId);
                return getCart(session);
            } catch (Exception e) {
                return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
            }
        } else {
            @SuppressWarnings("unchecked")
            List<CartItem> guestCart = (List<CartItem>) session.getAttribute("guestCart");
            if (guestCart != null) {
                guestCart.removeIf(item -> item.getProduct().getId().equals(productId));
                session.setAttribute("guestCart", guestCart);
            }
            return getCart(session);
        }
    }

    @DeleteMapping("/clear")
    public ResponseEntity<?> clearCart(HttpSession session) {
        User user = (User) session.getAttribute("currentUser");
        if (user != null) {
            cartService.clearCart(user);
            return getCart(session);
        } else {
            session.removeAttribute("guestCart");
            return getCart(session);
        }
    }
}
