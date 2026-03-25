package com.college.placement.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

@Service
public class OpenAIService {

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final String apiKey;
    private final String model;

    public OpenAIService(@Value("${app.openai.api-key:}") String apiKey,
                         @Value("${app.openai.model:gpt-4o-mini}") String model) {
        String envKey = System.getenv("OPENAI_API_KEY");
        this.apiKey = (apiKey == null || apiKey.isBlank()) ? envKey : apiKey;
        this.model = model;
    }

    public boolean isConfigured() {
        return apiKey != null && !apiKey.isBlank();
    }

    public void testConnection() throws Exception {
        if (!isConfigured()) {
            throw new IllegalStateException("OPENAI_API_KEY not set");
        }

        ArrayNode input = objectMapper.createArrayNode();
        ObjectNode msg = objectMapper.createObjectNode();
        msg.put("role", "user");
        msg.put("content", "Respond with OK.");
        input.add(msg);

        ObjectNode payloadNode = objectMapper.createObjectNode();
        payloadNode.put("model", model);
        payloadNode.set("input", input);

        String payload = payloadNode.toString();

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("https://api.openai.com/v1/responses"))
                .header("Authorization", "Bearer " + apiKey)
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(payload))
                .build();

        HttpClient client = HttpClient.newHttpClient();
        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() >= 400) {
            throw new IllegalStateException("OpenAI API error: " + response.statusCode() + " - " + response.body());
        }
    }

    public String analyzeResumeText(String resumeText) throws Exception {
        if (apiKey == null || apiKey.isBlank()) {
            throw new IllegalStateException("OPENAI_API_KEY not set");
        }

        ArrayNode input = objectMapper.createArrayNode();
        ObjectNode msg = objectMapper.createObjectNode();
        msg.put("role", "user");
        msg.put("content", "Analyze this resume and respond with strict JSON: {\"skills\":[],\"missingSkills\":[],\"placementChance\":number,\"suggestions\":[]}. Resume:\n" + resumeText);
        input.add(msg);

        ObjectNode payloadNode = objectMapper.createObjectNode();
        payloadNode.put("model", model);
        payloadNode.set("input", input);

        String payload = payloadNode.toString();

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("https://api.openai.com/v1/responses"))
                .header("Authorization", "Bearer " + apiKey)
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(payload))
                .build();

        HttpClient client = HttpClient.newHttpClient();
        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() >= 400) {
            throw new IllegalStateException("OpenAI API error: " + response.statusCode() + " - " + response.body());
        }

        JsonNode root = objectMapper.readTree(response.body());
        JsonNode outputText = root.path("output_text");
        if (!outputText.isMissingNode()) {
            return outputText.asText();
        }
        return response.body();
    }
}
