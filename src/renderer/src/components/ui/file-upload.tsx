import { cn } from '@/lib/utils';
import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileGit2, Check, FolderGit2 } from 'lucide-react';
import { useDropzone } from 'react-dropzone';

const mainVariant = {
  initial: {
    x: 0,
    y: 0,
  },
  animate: {
    x: 20,
    y: -20,
    opacity: 0.9,
  },
};

const secondaryVariant = {
  initial: {
    opacity: 0,
  },
  animate: {
    opacity: 1,
  },
};

export const FileUpload = ({
  onChange,
}: {
  onChange?: (files: File[]) => void;
}) => {
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (newFiles: File[]) => {
    setFiles((prevFiles) => [...prevFiles, ...newFiles]);
    onChange && onChange(newFiles);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const { getRootProps, isDragActive } = useDropzone({
    multiple: true,
    noClick: true,
    onDrop: handleFileChange,
    onDropRejected: (error) => {
      console.log(error);
    },
  });

  return (
    <div className="w-full" {...getRootProps()}>
      <motion.div
        onClick={handleClick}
        whileHover="animate"
        className="group/file relative block w-full cursor-pointer overflow-hidden rounded-3xl p-8 apple-glass border border-white/10 shadow-2xl"
      >
        <input
          ref={fileInputRef}
          id="file-upload-handle"
          type="file"
          // @ts-ignore
          webkitdirectory=""
          directory=""
          onChange={(e) => handleFileChange(Array.from(e.target.files || []))}
          className="hidden"
        />
        <div className="absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,white,transparent)] pointer-events-none opacity-40">
          <GridPattern />
        </div>
        <div className="flex flex-col items-center justify-center relative z-20">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-400 via-cyan-400 to-indigo-500 text-slate-950 flex items-center justify-center shadow-lg shadow-teal-500/25 border border-white/20 mb-3">
            <Upload className="w-6 h-6 stroke-[2.5]" />
          </div>
          <p className="relative z-20 font-sans text-base font-extrabold text-slate-100 tracking-tight">
            Drag & Drop Git Project Folders Here
          </p>
          <p className="relative z-20 mt-1 font-sans text-xs font-medium text-slate-400">
            Or click anywhere inside this area to browse project folders on your computer
          </p>
          <div className="relative mx-auto mt-6 w-full max-w-xl">
            {files.length > 0 &&
              files.slice(0, 3).map((file, idx) => (
                <motion.div
                  key={'file' + idx}
                  layoutId={idx === 0 ? 'file-upload' : 'file-upload-' + idx}
                  className={cn(
                    'relative z-40 mx-auto mt-3 flex w-full flex-col items-start justify-start overflow-hidden rounded-2xl bg-slate-950/90 p-4 border border-white/10 shadow-xl'
                  )}
                >
                  <div className="flex w-full items-center justify-between gap-4">
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      layout
                      className="flex items-center space-x-2 max-w-xs truncate text-xs font-bold text-slate-200"
                    >
                      <FolderGit2 className="w-4 h-4 text-teal-400 shrink-0" />
                      <span className="truncate">{(file as any).path || file.name}</span>
                    </motion.div>
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      layout
                      className="shrink-0 rounded-xl bg-teal-500/15 border border-teal-500/30 px-2.5 py-1 text-[10px] font-extrabold text-teal-300 font-mono"
                    >
                      Inspected
                    </motion.p>
                  </div>
                </motion.div>
              ))}
            {!files.length && (
              <motion.div
                layoutId="file-upload"
                variants={mainVariant}
                transition={{
                  type: 'spring',
                  stiffness: 300,
                  damping: 20,
                }}
                className={cn(
                  'relative z-40 mx-auto mt-2 flex h-24 w-full max-w-[8rem] items-center justify-center rounded-2xl bg-slate-900/90 border border-white/10 group-hover/file:border-teal-400/50 shadow-xl'
                )}
              >
                {isDragActive ? (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center text-xs font-bold text-teal-300"
                  >
                    Drop Folder
                    <Upload className="h-4 w-4 text-teal-300 mt-1 animate-bounce" />
                  </motion.p>
                ) : (
                  <Upload className="h-5 w-5 text-teal-400" />
                )}
              </motion.div>
            )}

            {!files.length && (
              <motion.div
                variants={secondaryVariant}
                className="absolute inset-0 z-30 mx-auto mt-2 flex h-24 w-full max-w-[8rem] items-center justify-center rounded-2xl border-2 border-dashed border-teal-400 bg-transparent opacity-0"
              ></motion.div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export function GridPattern() {
  const columns = 31;
  const rows = 9;
  return (
    <div className="flex shrink-0 scale-105 flex-wrap items-center justify-center gap-x-px gap-y-px bg-slate-950/40">
      {Array.from({ length: rows }).map((_, row) =>
        Array.from({ length: columns }).map((_, col) => {
          const index = row * columns + col;
          return (
            <div
              key={`${col}-${row}`}
              className={`flex h-8 w-8 shrink-0 rounded-[2px] ${
                index % 2 === 0
                  ? 'bg-slate-900/30'
                  : 'bg-slate-900/20 shadow-[0px_0px_1px_1px_rgba(255,255,255,0.02)_inset]'
              }`}
            />
          );
        })
      )}
    </div>
  );
}
