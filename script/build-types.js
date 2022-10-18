import path from 'path'
import { fileURLToPath } from 'url'
import { Project } from 'ts-morph'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const main = async () => {
  const project = new Project({
    tsConfigFilePath: path.resolve(__dirname, '../tsconfig.types.json'),
    outDir: '../types'
  })

  const diagnostics = project.getPreEmitDiagnostics()

  console.log(project.formatDiagnosticsWithColorAndContext(diagnostics))

  await project.emit()

  const result = project.emitToMemory()

  console.info(
    `\nSuccess emit declaration file!\n
    The project has generate ${result._files.length} typescript declaration files\n`
  )
}

main()
