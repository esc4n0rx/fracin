"use client";

import { useState } from "react";
import { supabase } from "./supabaseClient";
import distribuirMateriais from "./components/DistribuirMateriais";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import * as XLSX from "xlsx";

interface AnaliseData {
  Cod: string | null;
  Loja: string | null;
  "Cód. Produto": string | null;
  Perda: number;
  "Receita Bruta": number;
}

export default function Home() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleFileUpload = async (file: File) => {
    try {
      toast.info("Fazendo upload da planilha...");
      const data = await readExcel(file);

      const { error } = await supabase.from("materiais").insert(data);

      if (error) throw error;

      toast.success("Upload concluído! Calculando distribuição...");
      setIsProcessing(true);

      const planilha = await distribuirMateriais();

      setIsProcessing(false);

      if (planilha instanceof Blob) {
        const link = document.createElement("a");
        link.href = URL.createObjectURL(planilha);
        link.download = "Distribuicao.xlsx";
        link.click();
      } else {
        console.error("Erro: O arquivo da planilha não é válido ou não foi gerado.");
      }

      toast.success("Distribuição concluída e planilha gerada!");
    } catch (error) {
      console.error("Erro ao processar:", error);
      toast.error("Erro ao processar os dados.");
      setIsProcessing(false);
    }
  };

  const readExcel = async (file: File) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        const data = new Uint8Array(e.target!.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        const json = XLSX.utils.sheet_to_json(worksheet);

        const formattedData = json.map((row: any) => ({
          codigo: row["CÓDIGO"]?.toString().trim() || null,
          descricao: row["DESCRIÇÃO"]?.toString().trim() || null,
          quantidade: Number(row["QUANTIDADE"]) || null,
        }));

        resolve(formattedData);
      };

      reader.onerror = (err) => reject(err);
      reader.readAsArrayBuffer(file);
    });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-white">
      <ToastContainer position="top-right" autoClose={3000} />

      {isProcessing && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="flex flex-col items-center">
            <div className="loader"></div>
            <p className="text-white mt-4 text-lg">Calculando... Por favor, aguarde.</p>
          </div>
        </div>
      )}

      <button
        onClick={() => setIsSettingsOpen(true)}
        className="fixed top-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-full shadow-lg hover:bg-blue-700 transition"
      >
        ⚙️ Configurações
      </button>

      <header className="text-center mb-8">
        <h1 className="text-4xl font-extrabold">Distribuidor de Materiais</h1>
        <p className="mt-4 text-gray-600 dark:text-gray-400">
          Suba sua planilha de entrada e receba a distribuição calculada para as lojas.
        </p>
      </header>

      <main className="w-full max-w-xl px-6">
        <div
          className="border-2 border-dashed border-gray-400 rounded-lg p-8 text-center bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const file = e.dataTransfer.files[0];
            if (file) handleFileUpload(file);
          }}
        >
          <p className="text-gray-500 dark:text-gray-300">
            Arraste e solte sua planilha aqui ou clique para selecionar.
          </p>
          <input
            type="file"
            accept=".xlsx, .csv"
            className="hidden"
            onChange={(e) => {
              if (e.target.files) handleFileUpload(e.target.files[0]);
            }}
          />
        </div>
      </main>
    </div>
  );
}
