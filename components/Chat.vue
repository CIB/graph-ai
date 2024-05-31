<template>
  <v-card outlined class="chat-container">
    <v-card-title class="chat-title">AI Assistant</v-card-title>
    <v-card-text class="chat-messages">
      <div v-for="message in messages" class="chat-message">
        <v-card outlined>
          <v-card-title>{{ message.isUser ? 'You' : 'Assistant' }}</v-card-title>
          <v-card-item v-if="message.context.length">
            <ContextCard :contextItems="message.context" />
          </v-card-item>
          <v-card-item v-if="!message.text">
            <v-progress-circular indeterminate size="64"></v-progress-circular>
          </v-card-item>
          <v-card-item v-else>
            {{ message.text }}
          </v-card-item>
        </v-card>
      </div>
    </v-card-text>
    <v-card-actions class="input-area">
      <v-text-field
        v-model="inputText"
        label="Type your message"
        outlined
        solo
        class="input-text"
      ></v-text-field>
      <v-btn @click="sendMessage" color="primary">Send</v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup lang="ts">
const { messages, isLoading, addMessage, startChat } = useAssistant();
const inputText = ref('');

const sendMessage = () => {
  if (inputText.value.trim() !== '') {
    addMessage({
      text: inputText.value,
      isUser: true,
    });
    startChat(inputText.value);
    inputText.value = '';
  }
};
</script>

<style scoped>
.chat-container {
  width: 98vw;
  height: 95vh;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
}

.chat-title {
  font-size: 24px;
  text-align: center;
}

.chat-messages {
  overflow-y: auto;
  flex-grow: 1; /* Take available space */
}

.chat-message {
  margin-bottom: 10px;
}

.input-area {
  align-items: center; /* Aligns the text field and button in the center vertically */
  width: 100%;
}

.input-text {
  flex-grow: 1; /* Expand text field to take available horizontal space */
}

.v-card-title {
  padding-bottom: 0;
}
</style>
