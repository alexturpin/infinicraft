import { z } from "zod"
import fs from "fs"

const resultsFile = "results.txt"

const logToFile = (line: string) => fs.appendFileSync(resultsFile, line + "\n")

const elements = new Set(["🌍 Earth", "🌬️ Wind", "🔥 Fire", "💧 Water"])
const combinations = new Set<string>([])

type Discovery = {
  combination: string
  result: string
  isNew: boolean
}

const discoveries: Discovery[] = []

const generateCombination = (a: string, b: string) => [a, b].sort().join(" + ")
const getElementName = (element: string) => {
  try {
    return element.split(" ")[1]
  } catch {
    console.log("Error getting element name", element)
  }
}

// https://neal.fun/api/infinite-craft/pair?first=Fire&second=Water

const pairSchema = z.object({
  result: z.string(),
  emoji: z.string().optional(),
  isNew: z.boolean(),
})

const tryPairs = async () => {
  let noHitCounts = 0
  const maxHits = 100

  while (true) {
    const f = Array.from(elements) //.filter((e) => e.toLocaleLowerCase().includes("harry potter"))
    const a = Array.from(f)[Math.floor(Math.random() * f.length)]!
    const b = Array.from(elements)[Math.floor(Math.random() * elements.size)]!
    const combination = generateCombination(a, b)

    if (!combinations.has(combination)) {
      combinations.add(combination)
      const response = await fetch(
        `https://neal.fun/api/infinite-craft/pair?first=${getElementName(
          a
        )}&second=${getElementName(b)}`,
        {
          headers: {
            Referer: "https://neal.fun/infinite-craft/",
            "User-Agent":
              "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          },
        }
      )

      const { result, emoji, isNew: isFirst } = pairSchema.parse(await response.json())

      if (result !== "Nothing") {
        const element = `${emoji ?? "�"} ${result}`
        const isNew = !elements.has(element)
        elements.add(element)
        discoveries.push({
          combination,
          result: element,
          isNew,
        })

        const log = `${combination} = ${element}${isNew ? " (new!)" : ""}${
          isFirst ? " (first!)" : ""
        }`
        console.log(log, elements.size)
        logToFile(log)
        noHitCounts = 0
      } else {
        logToFile(`${combination} = Nothing`)
        if (++noHitCounts > maxHits) {
          console.log("No hits for a while, stopping")
          break
        }
      }
    }

    await new Promise((resolve) => setTimeout(resolve, Math.random() * 567))
  }
}

const previous = fs.readFileSync(resultsFile, "utf-8").split("\n")
for (const line of previous) {
  if (!line) continue
  const [combination, result] = line.split(" = ")
  elements.add((result as string).replace("(new!)", "").replace("(first!)", "").trim())
  combinations.add((combination as string).trim())
}

tryPairs()
