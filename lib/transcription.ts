import { Deepgram } from '@deepgram/sdk'

export async function transcribeSesion(recordingUrl: string): Promise<string> {
  if (!process.env.DEEPGRAM_API_KEY) {
    throw new Error('DEEPGRAM_API_KEY not configured')
  }

  try {
    const deepgram = new Deepgram(process.env.DEEPGRAM_API_KEY)

    const response = await deepgram.listen.prerecorded.transcribeUrl(
      { url: recordingUrl },
      {
        model: 'nova-2',
        language: 'es',
        smart_format: true,
      }
    )

    const transcript = response.result?.results?.channels[0]?.alternatives[0]?.transcript
    return transcript || ''
  } catch (err) {
    console.error('Transcription error:', err)
    throw new Error('Failed to transcribe recording')
  }
}
