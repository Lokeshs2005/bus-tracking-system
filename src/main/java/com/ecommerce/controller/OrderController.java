package com.ecommerce.controller;

import com.ecommerce.dto.CheckoutRequest;
import com.ecommerce.model.Order;
import com.ecommerce.model.OrderItem;
import com.ecommerce.model.User;
import com.ecommerce.service.OrderService;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    private Map<String, Object> serializeOrder(Order order) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", order.getId());
        map.put("orderNumber", order.getOrderNumber());
        map.put("totalAmount", order.getTotalAmount());
        map.put("shippingCost", order.getShippingCost());
        map.put("taxAmount", order.getTaxAmount());
        map.put("status", order.getStatus());
        map.put("shippingName", order.getShippingName());
        map.put("shippingEmail", order.getShippingEmail());
        map.put("shippingAddress", order.getShippingAddress());
        map.put("shippingCity", order.getShippingCity());
        map.put("shippingZip", order.getShippingZip());
        
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
        map.put("createdAt", order.getCreatedAt() != null ? order.getCreatedAt().format(formatter) : "");

        List<Map<String, Object>> itemsList = new ArrayList<>();
        if (order.getOrderItems() != null) {
            for (OrderItem item : order.getOrderItems()) {
                Map<String, Object> itemMap = new HashMap<>();
                itemMap.put("productId", item.getProduct().getId());
                itemMap.put("productName", item.getProduct().getName());
                itemMap.put("imageUrl", item.getProduct().getImageUrl());
                itemMap.put("price", item.getPrice());
                itemMap.put("quantity", item.getQuantity());
                
                BigDecimal subtotal = item.getPrice().multiply(BigDecimal.valueOf(item.getQuantity()));
                itemMap.put("subtotal", subtotal);
                itemsList.add(itemMap);
            }
        }
        map.put("orderItems", itemsList);
        return map;
    }

    @PostMapping("/checkout")
    public ResponseEntity<?> checkout(@Valid @RequestBody CheckoutRequest request, HttpSession session) {
        User user = (User) session.getAttribute("currentUser");
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Please login to proceed with checkout"));
        }

        try {
            Order order = orderService.placeOrder(
                    user,
                    request.getShippingName(),
                    request.getShippingEmail(),
                    request.getShippingAddress(),
                    request.getShippingCity(),
                    request.getShippingZip()
            );
            return ResponseEntity.ok(serializeOrder(order));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{code}")
    public ResponseEntity<?> getOrderDetails(@PathVariable("code") String orderNumber, HttpSession session) {
        User user = (User) session.getAttribute("currentUser");
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Unauthorized access"));
        }

        try {
            Order order = orderService.getOrderByOrderNumber(orderNumber);
            if (!order.getUser().getId().equals(user.getId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Access denied to order details"));
            }
            return ResponseEntity.ok(serializeOrder(order));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<?> getUserOrders(HttpSession session) {
        User user = (User) session.getAttribute("currentUser");
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Unauthorized access"));
        }

        List<Order> orders = orderService.getOrdersByUser(user);
        List<Map<String, Object>> serialized = new ArrayList<>();
        for (Order order : orders) {
            serialized.add(serializeOrder(order));
        }
        return ResponseEntity.ok(serialized);
    }
}
