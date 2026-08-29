'use client';

import { useRef, useState, useCallback } from 'react';
import imageCompression from 'browser-image-compression';
import { ImagePlus, Trash2, Loader2 } from 'lucide-react';
import { validatePhotoFile } from '@/lib/storage';
import { cn } from '@/lib/utils';

const MAX_PHOTOS = 5;

type PhotoUploaderProps = {
	existingUrls: string[];
	onUrlsChange: (urls: string[]) => void;
	removedUrls?: string[];
	onUrlsRemoved?: (urls: string[]) => void;
	newFiles: File[];
	onFilesChange: (files: File[]) => void;
	disabled?: boolean;
}

export function PhotoUploader({
	existingUrls,
	onUrlsChange,
	removedUrls = [],
	onUrlsRemoved,
	newFiles,
	onFilesChange,
	disabled,
}: PhotoUploaderProps) {
	const inputRef = useRef<HTMLInputElement>(null);
	const [previews, setPreviews] = useState<string[]>([]);
	const [compressing, setCompressing] = useState(false);
	const [error, setError] = useState('');

	const totalPhotos = existingUrls.length + newFiles.length;

	const handleFiles = useCallback(
		async (fileList: FileList | null) => {
			if (!fileList) return;
			setError('');
			setCompressing(true);

			try {
				const compressed: File[] = [];
				const newPreviews: string[] = [];

				for (const file of Array.from(fileList)) {
					if (totalPhotos + compressed.length >= MAX_PHOTOS) break;

					const validationError = validatePhotoFile(file);
					if (validationError) {
						setError(validationError);
						continue;
					}

					const output = await imageCompression(file, {
						maxSizeMB: 1,
						maxWidthOrHeight: 1200,
						useWebWorker: true,
					});

					const compressedFile = new File([output], file.name, {
						type: output.type || file.type,
					});

					compressed.push(compressedFile);
					newPreviews.push(URL.createObjectURL(compressedFile));
				}

				if (compressed.length > 0) {
					onFilesChange([...newFiles, ...compressed]);
					setPreviews((prev) => [...prev, ...newPreviews]);
				}
			} catch {
				setError('Erro ao processar as fotos. Tente novamente.');
			} finally {
				setCompressing(false);
				if (inputRef.current) inputRef.current.value = '';
			}
		},
		[totalPhotos, newFiles, onFilesChange],
	);

	const removeExisting = (index: number) => {
		const removed = existingUrls[index];
		onUrlsChange(existingUrls.filter((_, i) => i !== index));
		if (removed && onUrlsRemoved) {
			onUrlsRemoved([...removedUrls, removed]);
		}
	};

	const removeNew = (index: number) => {
		URL.revokeObjectURL(previews[index]);
		onFilesChange(newFiles.filter((_, i) => i !== index));
		setPreviews((prev) => prev.filter((_, i) => i !== index));
	};

	const canAdd = totalPhotos < MAX_PHOTOS && !disabled;

	return (
		<div className="space-y-2">
			<p className="text-sm font-semibold">
				Fotos ({totalPhotos}/{MAX_PHOTOS})
			</p>

			{(existingUrls.length > 0 || previews.length > 0) && (
				<div className="flex flex-wrap gap-3">
					{existingUrls.map((url, i) => (
						<div key={`existing-${url}-${i}`} className="relative">
							<img
								src={url}
								alt=""
								className="h-20 w-20 rounded-xl object-cover"
							/>
							{!disabled && (
								<button
									type="button"
									aria-label="Remover foto"
									onClick={() => removeExisting(i)}
									className="absolute -right-2 -top-2 rounded-full bg-destructive p-1 text-destructive-foreground"
								>
									<Trash2 className="h-3 w-3" />
								</button>
							)}
						</div>
					))}
					{previews.map((url, i) => (
						<div key={`preview-${i}`} className="relative">
							<img
								src={url}
								alt=""
								className="h-20 w-20 rounded-xl object-cover"
							/>
							{!disabled && (
								<button
									type="button"
									aria-label="Remover foto"
									onClick={() => removeNew(i)}
									className="absolute -right-2 -top-2 rounded-full bg-destructive p-1 text-destructive-foreground"
								>
									<Trash2 className="h-3 w-3" />
								</button>
							)}
						</div>
					))}
				</div>
			)}

			{canAdd && (
				<div>
					<input
						ref={inputRef}
						type="file"
						accept="image/jpeg,image/png,image/webp"
						multiple
						className="hidden"
						onChange={(e) => handleFiles(e.target.files)}
					/>
					<button
						type="button"
						onClick={() => inputRef.current?.click()}
						disabled={compressing}
						className={cn(
							'flex min-h-[44px] items-center gap-2 rounded-xl border border-dashed border-border px-4 text-sm font-semibold transition-colors hover:border-primary hover:text-primary',
							compressing && 'opacity-60 cursor-not-allowed',
						)}
					>
						{compressing ? (
							<Loader2 className="h-4 w-4 animate-spin" />
						) : (
							<ImagePlus className="h-4 w-4" />
						)}
						{compressing ? 'Comprimindo...' : 'Adicionar fotos'}
					</button>
					<p className="text-xs text-muted-foreground">
						JPG, PNG ou WebP. Máximo 5MB por foto.
					</p>
				</div>
			)}

			{error && (
				<p className="text-xs text-destructive">{error}</p>
			)}
		</div>
	);
}
