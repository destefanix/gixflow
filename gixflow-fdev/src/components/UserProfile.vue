<template>
  <div class="profile-container">
    <h2>Area Personale</h2>

    <div v-if="user">
      <!-- SEZIONE DATI PERSONALI -->
      <form @submit.prevent="updateProfile" class="form-section">
        <h3>Dati Personali</h3>
        <div class="grid-container">
          <div class="input-group">
            <label>Nome</label>
            <input v-model="user.nome" type="text" required />
          </div>

          <div class="input-group">
            <label>Cognome</label>
            <input v-model="user.cognome" type="text" required />
          </div>

          <div class="input-group">
            <label>Email</label>
            <input v-model="user.email" type="email" required />
          </div>

         
          <div class="input-group">
            <label>Telefono</label>
            <input v-model="user.telefono" type="text" />
          </div>

          <div class="input-group">
            <label>Codice Fiscale</label>
            <input v-model="user.codice_fiscale" type="text" />
          </div>

          <div class="input-group">
            <label>Partita IVA</label>
            <input v-model="user.partita_iva" type="text" />
          </div>

          <div class="input-group">
            <label>Indirizzo</label>
            <input v-model="user.indirizzo" type="text" />
          </div>

          <div class="input-group">
            <label>Città</label>
            <input v-model="user.city" type="text" />
          </div>

          <div class="input-group">
            <label>Provincia</label>
            <input v-model="user.provincia" type="text" />
          </div>

          <div class="input-group">
            <label>CAP</label>
            <input v-model="user.cap" type="text" />
          </div>
        </div>

        <button type="submit" class="btn-primary">Salva Modifiche</button>
      </form>

      <!-- SEZIONE CAMBIO PASSWORD -->
      <div class="grid-container">
      <form @submit.prevent="changePassword" class="form-section">
        <h3>Cambia Password</h3>
        <div class="input-group">
          <label>Password attuale</label>
          <div class="password-container">
            <input :type="showOldPassword ? 'text' : 'password'" v-model="passwords.oldPassword" required />
            <span @click="showOldPassword = !showOldPassword" class="toggle-password"><i class="fa-solid fa-eye"></i></span>
          </div>
        </div>

        <div class="input-group">
          <label>Nuova Password</label>
          <div class="password-container">
            <input :type="showNewPassword ? 'text' : 'password'" v-model="passwords.newPassword" required />
            <span @click="showNewPassword = !showNewPassword" class="toggle-password"><i class="fa-solid fa-eye"></i></span>
          </div>
        </div>

        <div class="input-group">
          <label>Conferma Nuova Password</label>
          <div class="password-container">
            <input :type="showConfirmPassword ? 'text' : 'password'" v-model="passwords.confirmPassword" required />
            <span @click="showConfirmPassword = !showConfirmPassword" class="toggle-password"><i class="fa-solid fa-eye"></i></span>
          </div>
        </div>

        <button type="submit" class="btn-primary">Cambia Password</button>
      </form>
    </div>

      <!-- SEZIONE 2FA -->
      <div class="grid-container">
      <div class="form-section">
        <h3>Autenticazione a Due Fattori (2FA)</h3>
        <button v-if="!user.two_factor_enabled" @click="enable2FA" class="btn-secondary">
          Abilita 2FA
        </button>

        <div v-if="qrCode">
          <p>Scansiona il codice con Google Authenticator</p>
          <img :src="qrCode" alt="QR Code" class="qr-code" />
          <input v-model="otpCode" type="text" placeholder="Inserisci codice OTP" />
          <button @click="verify2FA" class="btn-primary">Verifica OTP</button>
        </div>

        <button v-if="user.two_factor_enabled" @click="disable2FA" class="btn-danger">
          Disabilita 2FA
        </button>
      </div>
    </div>

    <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
    <p v-if="successMessage" class="success-message">{{ successMessage }}</p>
  </div>
</div>
</template>

<script>
import axios from "axios";
import { ref, onMounted } from "vue";

export default {
  setup() {
    const user = ref(null);
    const passwords = ref({ oldPassword: "", newPassword: "", confirmPassword: "" });
    const qrCode = ref(null);
    const otpCode = ref("");
    const errorMessage = ref("");
    const successMessage = ref("");

    const showOldPassword = ref(false);
    const showNewPassword = ref(false);
    const showConfirmPassword = ref(false);

    // Carica i dati dell'utente
    const fetchUser = async () => {
      try {
        const response = await axios.get(`${process.env.VUE_APP_API_URL}/user/me`);
        user.value = response.data;
      } catch (error) {
        console.error("Errore nel caricamento utente:", error);
      }
    };

    // Aggiorna i dati personali
    const updateProfile = async () => {
      try {
        await axios.put(`${process.env.VUE_APP_API_URL}/user/update`, user.value);
        successMessage.value = "Profilo aggiornato con successo!";
      } catch (error) {
        errorMessage.value = "Errore nell'aggiornamento del profilo.";
      }
    };

    // Cambia password
    const changePassword = async () => {
      if (passwords.value.newPassword !== passwords.value.confirmPassword) {
        errorMessage.value = "Le password non coincidono!";
        return;
      }
      try {
        await axios.post(`${process.env.VUE_APP_API_URL}/user/change-password`, passwords.value);
        successMessage.value = "Password cambiata con successo!";
        passwords.value = { oldPassword: "", newPassword: "", confirmPassword: "" };
      } catch (error) {
        errorMessage.value = "Errore nel cambio password.";
      }
    };

    // Abilita il 2FA
    const enable2FA = async () => {
      try {
        const response = await axios.post(`${process.env.VUE_APP_API_URL}/user/enable-2fa`);
        qrCode.value = response.data.qrCode;
      } catch (error) {
        errorMessage.value = "Errore nell'abilitazione del 2FA.";
      }
    };

    // Verifica il 2FA con il codice OTP
    const verify2FA = async () => {
      try {
        await axios.post(`${process.env.VUE_APP_API_URL}/user/verify-2fa`, { otp: otpCode.value });
        successMessage.value = "2FA abilitato con successo!";
        user.value.two_factor_enabled = 1;
        qrCode.value = null;
      } catch (error) {
        errorMessage.value = "Codice OTP errato.";
      }
    };

    // Disabilita il 2FA
    const disable2FA = async () => {
      try {
        await axios.post(`${process.env.VUE_APP_API_URL}/user/disable-2fa`);
        successMessage.value = "2FA disabilitato.";
        user.value.two_factor_enabled = 0;
        qrCode.value = null;
      } catch (error) {
        errorMessage.value = "Errore nella disabilitazione del 2FA.";
      }
    };

    onMounted(fetchUser);

    return {
      user,
      passwords,
      qrCode,
      otpCode,
      errorMessage,
      successMessage,
      showOldPassword,
      showNewPassword,
      showConfirmPassword,
      updateProfile,
      changePassword,
      enable2FA,
      verify2FA,
      disable2FA,
    };
  },
};
</script>


<style scoped>

.profile-container {
  max-width: auto;
  margin: 0 auto;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

h2 {
  text-align: center;
  color: #2c3e50;
}

.form-section {
  margin-top: 20px;
  padding: 15px;
  border-radius: 5px;
  background: #f9f9f9;
}

.grid-container {
  display: grid;
  grid-template-columns: repeat(4, 2fr);
  gap: 15px;
}

.input-group {
  margin-bottom: 10px;
}

.password-container {
  display: flex;
  align-items: center;
}

.toggle-password {
  cursor: pointer;
  margin-left: 10px;
}

button {
  width: 100%;
  padding: 10px;
  margin-top: 10px;
}

.btn-primary {
  background: #71b095;
  color: white;
}

.btn-danger {
  background: #e74c3c;
  color: white;
}


</style>
