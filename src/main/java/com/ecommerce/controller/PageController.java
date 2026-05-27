package com.ecommerce.controller;

import com.ecommerce.model.CartItem;
import com.ecommerce.model.Product;
import com.ecommerce.model.User;
import com.ecommerce.service.CartService;
import com.ecommerce.service.ProductService;
import com.ecommerce.service.OrderService;
import jakarta.servlet.http.HttpSession;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import java.math.BigDecimal;
import java.util.List;

@Controller
public class PageController {

    private final ProductService productService;
    private final CartService cartService;
    private final OrderService orderService;

    public PageController(ProductService productService, CartService cartService, OrderService orderService) {
        this.productService = productService;
        this.cartService = cartService;
        this.orderService = orderService;
    }

    @GetMapping("/")
    public String showCatalog(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String category,
            HttpSession session,
            Model model) {
        
        List<Product> products;
        if (category != null && !category.trim().isEmpty()) {
            products = productService.getProductsByCategory(category);
            model.addAttribute("selectedCategory", category);
        } else if (search != null && !search.trim().isEmpty()) {
            products = productService.searchProducts(search);
            model.addAttribute("searchQuery", search);
        } else {
            products = productService.getAllProducts();
        }

        model.addAttribute("products", products);
        model.addAttribute("categories", productService.getAllCategories());

        User currentUser = (User) session.getAttribute("currentUser");
        if (currentUser != null) {
            model.addAttribute("user", currentUser);
            List<CartItem> cartItems = cartService.getCartItems(currentUser);
            model.addAttribute("cartItems", cartItems);
            
            // Calculate subtotal
            BigDecimal subtotal = BigDecimal.ZERO;
            int cartCount = 0;
            for (CartItem item : cartItems) {
                subtotal = subtotal.add(item.getProduct().getPrice().multiply(BigDecimal.valueOf(item.getQuantity())));
                cartCount += item.getQuantity();
            }
            model.addAttribute("cartSubtotal", subtotal);
            model.addAttribute("cartCount", cartCount);
        }

        return "index";
    }

    @GetMapping("/login")
    public String showLogin(
            @RequestParam(required = false) String register,
            HttpSession session,
            Model model) {
        
        if (session.getAttribute("currentUser") != null) {
            return "redirect:/";
        }
        
        model.addAttribute("showRegister", register != null);
        return "login";
    }

    @GetMapping("/checkout")
    public String showCheckout(HttpSession session, Model model) {
        User currentUser = (User) session.getAttribute("currentUser");
        if (currentUser == null) {
            return "redirect:/login";
        }

        List<CartItem> cartItems = cartService.getCartItems(currentUser);
        if (cartItems.isEmpty()) {
            return "redirect:/";
        }

        BigDecimal subtotal = BigDecimal.ZERO;
        for (CartItem item : cartItems) {
            subtotal = subtotal.add(item.getProduct().getPrice().multiply(BigDecimal.valueOf(item.getQuantity())));
        }

        BigDecimal tax = subtotal.multiply(new BigDecimal("0.08")).setScale(2, BigDecimal.ROUND_HALF_UP);
        BigDecimal shipping = subtotal.compareTo(new BigDecimal("100.00")) >= 0 ? BigDecimal.ZERO : new BigDecimal("9.99");
        BigDecimal total = subtotal.add(tax).add(shipping).setScale(2, BigDecimal.ROUND_HALF_UP);

        model.addAttribute("user", currentUser);
        model.addAttribute("cartItems", cartItems);
        model.addAttribute("subtotal", subtotal);
        model.addAttribute("tax", tax);
        model.addAttribute("shipping", shipping);
        model.addAttribute("total", total);

        return "checkout";
    }

    @GetMapping("/orders")
    public String showOrders(HttpSession session, Model model) {
        User currentUser = (User) session.getAttribute("currentUser");
        if (currentUser == null) {
            return "redirect:/login";
        }

        model.addAttribute("user", currentUser);
        model.addAttribute("orders", orderService.getOrdersByUser(currentUser));
        return "orders";
    }
}
