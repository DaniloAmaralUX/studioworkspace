/** Remove blocos de raciocínio que alguns modelos reasoning devolvem junto
 * do conteúdo visível. O usuário recebe somente a resposta final. */
export function cleanAssistantText(input: string): string {
  let text = input.trim()
  const finalThinkTag = text.toLowerCase().lastIndexOf('</think>')
  if (finalThinkTag >= 0) {
    text = text.slice(finalThinkTag + '</think>'.length)
  } else {
    const openThinkTag = text.toLowerCase().indexOf('<think>')
    if (openThinkTag >= 0) text = text.slice(0, openThinkTag)
  }
  text = text.replace(/<think>[\s\S]*?<\/think>/gi, '')
  return text.trim()
}
