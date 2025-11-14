
const httpTrigger: any = async function (context: any): Promise<void> {
  context.res = {
    body: { message: "Hello from Azure Functions2!" }
  }
}

export default httpTrigger