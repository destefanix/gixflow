<template>
  <div class="login-container">
    <div class="login-box">
      <img src="https://app.gixflow.cloud/flow_logo.png" alt="GIX Flow Logo" class="logo" />
      <h2>Benvenuto</h2>
      <p v-if="!twoFactorRequired">Accedi a GIX Flow con le tue credenziali e l'OTP da Authenticator.</p>
      <p v-else>Inserisci il codice OTP</p>

      <form @submit.prevent="handleLogin">
        <!-- LOGIN NORMALE -->
        <div v-if="!twoFactorRequired">
          <div class="input-group">
            <label for="usernameOrEmail">Email</label>
            <input v-model="usernameOrEmail" type="text" id="usernameOrEmail" required placeholder="Inserisci username o email" />
          </div>

          <div class="input-group">
            <label for="password">Password</label>
            <input v-model="password" type="password" id="password" required placeholder="Inserisci la password" />
          </div>
        </div>

        <!-- OTP -->
        <div v-else>
          <div class="input-group">
            <label for="otp">Codice OTP</label>
            <input v-model="otpCode" type="text" id="otp" required placeholder="Inserisci codice OTP" />
          </div>
        </div>

        <button type="submit" class="login-btn">
          {{ twoFactorRequired ? "Verifica OTP" : "Accedi" }}
        </button>

        <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
      </form>
    </div>
  </div>
</template>

<script>
import axios from "axios";

export default {
  data() {
    return {
      usernameOrEmail: "",
      password: "",
      otpCode: "",
      errorMessage: "",
      twoFactorRequired: false,
      tempToken: "",
    };
  },
  methods: {
     
    

    async handleLogin() {
  try {
    if (!this.twoFactorRequired) {
      // 🔹 Primo step: Login con username/password
      const response = await axios.post(`${process.env.VUE_APP_API_URL}/login`, {
        usernameOrEmail: this.usernameOrEmail,
        password: this.password,
      });

      console.log("[DEBUG] Risposta login:", response.data);

      if (response.data.twoFactorRequired) {
        // ✅ Salviamo il token temporaneo per il 2FA
        this.twoFactorRequired = true;
        this.tempToken = response.data.tempToken;
        console.log("[DEBUG] Token temporaneo ricevuto:", this.tempToken);
      } else {
        // ✅ Se il 2FA NON è attivo, reindirizziamo l'utente
        localStorage.setItem("token", response.data.token);
        axios.defaults.headers.common["Authorization"] = `Bearer ${response.data.token}`;
        this.$router.push("/user/profile");
      }
    } else {
      // 🔹 Secondo step: Verifica OTP
      console.log("[DEBUG] Token inviato per verifica OTP:", this.tempToken);
      console.log("[DEBUG] OTP inserito:", this.otpCode);

      const response = await axios.post(
        `${process.env.VUE_APP_API_URL}/verify-login-otp`,
        { otp: this.otpCode, token: this.tempToken },  // 🔥 Verifichiamo che il token venga inviato correttamente
        { headers: { "Content-Type": "application/json" } } // 🔥 Assicuriamoci che il server riceva il JSON
      );

      console.log("[DEBUG] Risposta verifica OTP:", response.data);

      // ✅ Se OTP corretto, salviamo il token definitivo
      localStorage.setItem("token", response.data.token);
      axios.defaults.headers.common["Authorization"] = `Bearer ${response.data.token}`;
      this.$router.push("/");
    }
  } catch (error) {
    console.error("[DEBUG] Errore login:", error.response?.data || error.message);
    this.errorMessage = error.response?.data?.message || "Errore durante il login";
  }
}, 

async handleOTPVerification() {
  try {
    const response = await axios.post(`${process.env.VUE_APP_API_URL}/verify-login-otp`, {
      otp: this.otpCode,
      token: this.tempToken, // 🔥 Assicuriamoci di passare il token giusto
    });

    console.log("[DEBUG] Nuovo token ricevuto:", response.data.token);

    // ✅ Salviamo il nuovo token JWT
    localStorage.setItem("token", response.data.token);
    axios.defaults.headers.common["Authorization"] = `Bearer ${response.data.token}`;

    // ✅ Ricarichiamo i dati utente e reindirizziamo alla Dashboard
    this.$router.push("/");
  } catch (error) {
    console.error("[DEBUG] Errore OTP:", error.response?.data || error.message);
    this.errorMessage = error.response?.data?.message || "Errore durante la verifica OTP";
  }
}





  },
};
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh; /* Full screen */
  width: 100vw;
  background: linear-gradient(to bottom, #71b095, #2c3e50);
  padding: 0;
  margin: 0;
  inset: 0; /* Top, bottom, left, right = 0 */
  z-index: 0; /* sotto tutto */
}



.login-box {
  background: white;
  padding: 50px;
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  text-align: center;
  width: 450px; /* AUMENTATO DA 380px A 450px */
  max-width: 95%;
}

/* ======== LOGO ======== */
.logo {
  width: 180px;
  margin-bottom: 20px;
}

/* ======== TITOLI ======== */
h2 {
  color: #2c3e50;
  font-size: 26px;
  margin-bottom: 5px;
}

p {
  color: #666;
  font-size: 14px;
  margin-bottom: 20px;
}

/* ======== INPUT ======== */
.input-group {
  text-align: left;
  margin-bottom: 15px;
  width: 430px;
  display: flex;
  flex-direction: column;
  align-items: flex-start; /* Mantiene il label allineato a sinistra */
}



label {
  font-weight: bold;
  color: #2c3e50;
  font-size: 14px;
  margin-bottom: 5px;
  display: block;
}

input {
  width: 100%;
  padding: 12px;
  border: 1px solid #ccc;
  border-radius: 5px;
  font-size: 14px;
  transition: all 0.3s ease-in-out;
}

input:focus {
  border-color: #71b095;
  outline: none;
  box-shadow: 0 0 5px rgba(113, 176, 149, 0.5);
}

/* ======== PULSANTE LOGIN ======== */
.login-btn {
  width: 100%;
  padding: 12px;
  background-color: #71b095;
  color: white;
  font-weight: bold;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 16px;
  margin-top: 10px;
  transition: all 0.3s ease-in-out;
}

.login-btn:hover {
  background-color: #2c3e50;
  transform: scale(1.05);
}

/* ======== MESSAGGI DI ERRORE ======== */
.error-message {
  color: red;
  font-size: 14px;
  margin-top: 10px;
}

/* ======== FIX per allineamento perfetto ======== */
form {
  display: flex;
  flex-direction: column;
  align-items: center; /* Allinea tutto al centro */
  width: 100%;
}

/* Stessa larghezza per input e bottone */
input,
.login-btn {
  width: calc(
    100% - 4px
  ); /* Assicura che non ci sia una differenza nei bordi */
}

@media (max-width: 768px) {
  .login-container {
    padding: 20px; /* Aggiunge un po' di respiro */
  }

  .login-box {
    width: 100%;
    padding: 30px 20px;
    box-shadow: none; /* Rende più piatto su schermi piccoli */
    border-radius: 8px;
  }

  .logo {
    width: 140px;
    margin-bottom: 16px;
  }

  .input-group {
    width: 100%;
  }

  input {
    font-size: 15px;
    padding: 12px;
  }

  .login-btn {
    font-size: 15px;
    padding: 12px;
    margin-top: 15px;
  }



  h2 {
    font-size: 22px;
  }

  p {
    font-size: 13px;
    margin-bottom: 15px;
  }

  .error-message {
    font-size: 13px;
  }
}



</style>
