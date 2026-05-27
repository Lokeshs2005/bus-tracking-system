package com.ecommerce.controller;

import com.ecommerce.service.GrokAiService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/grok")
public class GrokAiController {

    private final GrokAiService grokAiService;

    public GrokAiController(GrokAiService grokAiService) {
        this.grokAiService = grokAiService;
    }

    @PostMapping("/suggestions")
    public ResponseEntity<?> getSuggestions(@RequestBody Map<String, String> request) {
        try {
            String prompt = request.get("prompt");
            if (prompt == null || prompt.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Prompt is required"));
            }
            String suggestion = grokAiService.getAiSuggestions(prompt);
            return ResponseEntity.ok(Map.of("suggestion", suggestion));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }
}
