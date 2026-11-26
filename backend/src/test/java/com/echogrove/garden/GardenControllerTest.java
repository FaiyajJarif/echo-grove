package com.echogrove.garden;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class GardenControllerTest {

    private static final String GARDEN = """
            {"name": "Test", "seed": 42, "depth": 6, "branches": 2, "spread": 25,
             "ratio": 0.7, "asymmetry": 0.2, "season": "spring", "tempo": 60,
             "wind": 0.3, "mode": "bloom", "publish": true}
            """;

    @Autowired
    private MockMvc mvc;

    @Autowired
    private ObjectMapper json;

    private String login(String email, String password) throws Exception {
        String body = mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"password\":\"" + password + "\"}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        JsonNode node = json.readTree(body);
        return node.get("token").asText();
    }

    @Test
    void guestsCannotSaveGardens() throws Exception {
        mvc.perform(post("/api/gardens").contentType(MediaType.APPLICATION_JSON).content(GARDEN))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void verifiedUserSavesAndGalleryShowsIt() throws Exception {
        String token = login("admin@test.dev", "admin-password-123");
        String body = mvc.perform(post("/api/gardens").header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON).content(GARDEN))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.code").isNotEmpty())
                .andExpect(jsonPath("$.season").value("SPRING"))
                .andExpect(jsonPath("$.published").value(true))
                .andReturn().getResponse().getContentAsString();
        String code = json.readTree(body).get("code").asText();

        mvc.perform(get("/api/gardens/" + code)).andExpect(status().isOk());
        mvc.perform(get("/api/gardens")).andExpect(jsonPath("$[?(@.code == '" + code + "')]").exists());
    }

    @Test
    void rejectsATreeAboveTheCallCap() throws Exception {
        String token = login("admin@test.dev", "admin-password-123");
        String big = GARDEN.replace("\"depth\": 6", "\"depth\": 8").replace("\"branches\": 2", "\"branches\": 3");
        mvc.perform(post("/api/gardens").header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON).content(big))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.withinCallCap").exists());
    }

    @Test
    void newUserCanSaveRightAwayAndWrongPasswordsLockTheAccount() throws Exception {
        mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"new@test.dev\",\"displayName\":\"New Gardener\",\"password\":\"password-123\"}"))
                .andExpect(status().isAccepted());

        String token = login("new@test.dev", "password-123");
        mvc.perform(post("/api/gardens").header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON).content(GARDEN))
                .andExpect(status().isCreated());

        for (int i = 0; i < 5; i++) {
            mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                            .content("{\"email\":\"new@test.dev\",\"password\":\"wrong-password\"}"))
                    .andExpect(status().isUnauthorized());
        }
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"new@test.dev\",\"password\":\"password-123\"}"))
                .andExpect(status().isTooManyRequests());
    }

    @Test
    void adminRoutesNeedTheAdminRole() throws Exception {
        mvc.perform(get("/api/admin/stats")).andExpect(status().isUnauthorized());
        String token = login("admin@test.dev", "admin-password-123");
        mvc.perform(get("/api/admin/stats").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.users").isNumber());
    }
}
