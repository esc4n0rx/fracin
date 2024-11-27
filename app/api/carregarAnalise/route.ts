import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import path from "path";
import { promises as fs } from "fs";

export async function GET() {
  try {
    // Caminho absoluto para o arquivo base.xlsx
    const filePath = path.join(process.cwd(), "public", "base.xlsx");
    console.log("Caminho do arquivo base.xlsx:", filePath);

    // Verificar se o arquivo existe
    try {
      await fs.access(filePath);
    } catch {
      return NextResponse.json(
        { error: "Arquivo base.xlsx não encontrado" },
        { status: 404 }
      );
    }

    // Carregar e processar o arquivo Excel
    const fileBuffer = await fs.readFile(filePath); // Leia o arquivo como um buffer
    const workbook = XLSX.read(fileBuffer, { type: "buffer" }); // Carregue o buffer no XLSX
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const analise = XLSX.utils.sheet_to_json(sheet);
    console.log("Dados carregados da planilha:", analise);

    // Retornar os dados da análise
    return NextResponse.json({ data: analise });
  } catch (error) {
    console.error("Erro ao carregar a planilha:", error);
    return NextResponse.json(
      { error: "Erro ao carregar a planilha" },
      { status: 500 }
    );
  }
}
