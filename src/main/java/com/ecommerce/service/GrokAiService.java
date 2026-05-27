package com.ecommerce.service;

import com.ecommerce.model.Product;
import com.ecommerce.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class GrokAiService {

    private final ProductRepository productRepository;
    private final RestTemplate restTemplate;

    @Value("${xai.grok.api-key:}")
    private String apiKey;

    public GrokAiService(ProductRepository productRepository) {
        this.productRepository = productRepository;
        this.restTemplate = new RestTemplate();
    }

    public String getAiSuggestions(String userPrompt) {
        if (userPrompt == null || userPrompt.trim().isEmpty()) {
            return "Please tell me what kind of desk styling or product you are looking for.";
        }

        // Try calling the xAI Grok API if key is present
        if (apiKey != null && !apiKey.trim().isEmpty()) {
            try {
                return callGrokApi(userPrompt);
            } catch (Exception e) {
                System.err.println("Grok API connection failed, invoking high-fidelity local recommender: " + e.getMessage());
            }
        }

        // Out-of-the-box highly cognitive fallback engine
        return generateLocalSuggestions(userPrompt);
    }

    private String callGrokApi(String userPrompt) {
        String url = "https://api.x.ai/v1/chat/completions";

        List<Product> allProducts = productRepository.findAll();
        StringBuilder context = new StringBuilder("You are Grok, an elite interior designer and luxury desk setup stylist for Ecommerce store. ");
        context.append("We sell the following premium items: \n");
        for (Product p : allProducts) {
            context.append("- ").append(p.getName()).append(" (Category: ").append(p.getCategory())
                   .append(", Price: $").append(p.getPrice()).append(", Description: ").append(p.getDescription()).append(")\n");
        }
        context.append("\nUsing only items from our catalog, recommend a stylish combo or product for the customer's request. Keep answers concise, highly elegant, in professional markdown styling.");

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Authorization", "Bearer " + apiKey);

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", "grok-1.5-chat"); // Standard xAI Model
        requestBody.put("messages", List.of(
            Map.of("role", "system", "content", context.toString()),
            Map.of("role", "user", "content", userPrompt)
        ));
        requestBody.put("temperature", 0.7);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
        ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);

        if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
            List choices = (List) response.getBody().get("choices");
            if (choices != null && !choices.isEmpty()) {
                Map choice = (Map) choices.get(0);
                Map message = (Map) choice.get("message");
                if (message != null) {
                    return (String) message.get("content");
                }
            }
        }
        throw new RuntimeException("Unexpected empty body from xAI Grok API");
    }

    private String generateLocalSuggestions(String userPrompt) {
        String prompt = userPrompt.toLowerCase();
        List<Product> catalog = productRepository.findAll();
        List<Product> matched = new ArrayList<>();

        boolean deskMatch = prompt.contains("desk") || prompt.contains("setup") || prompt.contains("station") || prompt.contains("workspace") || prompt.contains("minimal");
        boolean keyboardMatch = prompt.contains("keyboard") || prompt.contains("type") || prompt.contains("typing") || prompt.contains("key") || prompt.contains("vortex");
        boolean audioMatch = prompt.contains("audio") || prompt.contains("sound") || prompt.contains("music") || prompt.contains("earbud") || prompt.contains("speaker") || prompt.contains("headphones");
        boolean lightMatch = prompt.contains("light") || prompt.contains("ambient") || prompt.contains("rgb") || prompt.contains("aura") || prompt.contains("neon");
        boolean monitorMatch = prompt.contains("monitor") || prompt.contains("arm") || prompt.contains("mount") || prompt.contains("ergo");
        boolean lifestyleMatch = prompt.contains("water") || prompt.contains("bottle") || prompt.contains("ceramic") || prompt.contains("lifestyle") || prompt.contains("drink");
        boolean watchMatch = prompt.contains("watch") || prompt.contains("fitness") || prompt.contains("apexfit") || prompt.contains("smartwatch");
        boolean leatherMatch = prompt.contains("mat") || prompt.contains("leather") || prompt.contains("pad");

        for (Product p : catalog) {
            String name = p.getName().toLowerCase();
            if (keyboardMatch && (name.contains("keyboard") || name.contains("vortex"))) matched.add(p);
            if (audioMatch && (name.contains("earbuds") || name.contains("speaker") || name.contains("sound"))) matched.add(p);
            if (lightMatch && (name.contains("light") || name.contains("bar") || name.contains("rgb"))) matched.add(p);
            if (monitorMatch && (name.contains("arm") || name.contains("ergo") || name.contains("dock"))) matched.add(p);
            if (lifestyleMatch && (name.contains("bottle") || name.contains("ceramic") || name.contains("zenflow"))) matched.add(p);
            if (watchMatch && (name.contains("watch") || name.contains("apexfit"))) matched.add(p);
            if (leatherMatch && (name.contains("mat") || name.contains("leather") || name.contains("novashield"))) matched.add(p);
        }

        // Default desk items if general request
        if (matched.isEmpty() && deskMatch) {
            for (Product p : catalog) {
                if (p.getName().contains("Keyboard") || p.getName().contains("Light") || p.getName().contains("Mat")) {
                    matched.add(p);
                }
            }
        }

        // Fallback to random two items if still empty
        if (matched.isEmpty()) {
            if (!catalog.isEmpty()) matched.add(catalog.get(0));
            if (catalog.size() > 1) matched.add(catalog.get(1));
        }

        StringBuilder response = new StringBuilder();
        response.append("I have analyzed your styling preferences against our luxury **Ecommerce** vault.\n\n");
        response.append("For a premium and refined desk atmosphere, I highly recommend introducing:\n\n");

        for (Product p : matched) {
            response.append("### **").append(p.getName()).append("** (").append(p.getCategory()).append(")\n");
            response.append("- **Price**: `$").append(p.getPrice()).append("`\n");
            response.append("- **Aesthetic Style**: ").append(p.getDescription()).append("\n\n");
        }

        response.append("### **Stylist Arrangement Tips:**\n");
        if (keyboardMatch || deskMatch) {
            response.append("- **Typing Geometry**: Position your mechanical keyboard centered with a premium desk mat to isolate mechanical acoustics.\n");
        }
        if (lightMatch || deskMatch) {
            response.append("- **Ambient Luminance**: Cast glowing ambient bars back against clean walls. This reduces visual fatigue and adds rich depth to deep cosmic glass setups.\n");
        }
        if (audioMatch) {
            response.append("- **Acoustic Focus**: Keep acoustic drivers positioned directly at ear level or use isolating ANC parameters when focusing in busy workspaces.\n");
        }
        response.append("- **Color Harmony**: Ecommerce gold and dark slate tones blend spectacularly with raw wood, deep metal, or clean matte surfaces.\n\n");
        response.append("Would you like me to suggest another luxury combo?");

        return response.toString();
    }
}
