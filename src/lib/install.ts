import { ref } from 'vue'

// Événement propre à Chrome / Edge sur Android et ordinateur (absent des types DOM standard)
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

// Renseigné quand le navigateur considère l'application comme installable
export const installPrompt = ref<BeforeInstallPromptEvent | null>(null)

// À appeler au démarrage : l'événement peut arriver avant le montage de l'application
export const listenForInstallPrompt = () => {
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault()
    installPrompt.value = event as BeforeInstallPromptEvent
  })

  window.addEventListener('appinstalled', () => {
    installPrompt.value = null
  })
}

export const promptInstall = async () => {
  const event = installPrompt.value
  if (!event) {
    return
  }

  await event.prompt()
  await event.userChoice
  // L'événement ne peut servir qu'une fois
  installPrompt.value = null
}
