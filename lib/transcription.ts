export async function transcribeSesion(recordingUrl: string): Promise<string> {
  // TODO: Implement real Deepgram transcription with updated SDK v3 API
  // For now, return mock transcription
  if (!recordingUrl) {
    throw new Error('Recording URL required')
  }
  return 'Mock transcription: Evaluación completada exitosamente. Sin hallazgos significativos.'
}
