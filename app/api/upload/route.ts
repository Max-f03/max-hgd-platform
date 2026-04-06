import { NextResponse } from "next/server"
import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"

function sanitizeFileName(fileName: string): string {
	return fileName
		.toLowerCase()
		.replace(/[^a-z0-9.-]+/g, "-")
		.replace(/-+/g, "-")
		.replace(/^-|-$/g, "")
}

export async function POST(req: Request) {
	try {
		const formData = await req.formData()
		const file = formData.get("file")

		if (!(file instanceof File)) {
			return NextResponse.json({ error: "Fichier manquant." }, { status: 400 })
		}

		const bytes = await file.arrayBuffer()
		const buffer = Buffer.from(bytes)

		const ext = path.extname(file.name)
		const baseName = path.basename(file.name, ext)
		const safeName = sanitizeFileName(baseName) || "file"
		const uniqueName = `${Date.now()}-${safeName}${ext}`

		const uploadDir = path.join(process.cwd(), "public", "uploads")
		await mkdir(uploadDir, { recursive: true })

		const filePath = path.join(uploadDir, uniqueName)
		await writeFile(filePath, buffer)

		return NextResponse.json({
			url: `/uploads/${uniqueName}`,
			name: file.name,
			type: file.type.startsWith("image") ? "image" : "document",
			size: file.size,
		})
	} catch {
		return NextResponse.json({ error: "Upload impossible." }, { status: 500 })
	}
}
