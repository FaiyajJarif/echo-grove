package com.echogrove.garden;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class GardenControllerTest {

    @Autowired
    private MockMvc mvc;

    @Test
    void plantsAGardenAndReturnsAShareCode() throws Exception {
        String body = """
                {"name": "Test", "seed": 42, "depth": 6, "branches": 2, "spread": 25,
                 "ratio": 0.7, "asymmetry": 0.2, "season": "spring", "tempo": 60,
                 "wind": 0.3, "mode": "bloom"}
                """;

        mvc.perform(post("/api/gardens").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.code").isNotEmpty())
                .andExpect(jsonPath("$.season").value("SPRING"));
    }

    @Test
    void rejectsATreeAboveTheCallCap() throws Exception {
        String body = """
                {"seed": 1, "depth": 8, "branches": 3, "spread": 25, "ratio": 0.7,
                 "asymmetry": 0.2, "season": "winter", "tempo": 60, "wind": 0.3, "mode": "trace"}
                """;

        mvc.perform(post("/api/gardens").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.withinCallCap").exists());
    }
}
