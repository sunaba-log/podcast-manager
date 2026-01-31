'use client';

import { useState } from 'react';
import { usePodcasts } from '@/hooks/usePodcasts';

interface CreateShowFormProps {
  onSuccess?: (podcastId: string) => void;
  onCancel?: () => void;
}

export function CreateShowForm({ onSuccess, onCancel }: CreateShowFormProps) {
  const { createPodcast, loading, error } = usePodcasts();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    author: '',
    category: '',
    language: 'ja',
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      const podcast = await createPodcast(formData);
      onSuccess?.(podcast.id);
    } catch (err) {
      // Error is handled by hook
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded text-red-800">{error}</div>
      )}

      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700">
          タイトル *
        </label>
        <input
          type="text"
          id="title"
          name="title"
          required
          value={formData.title}
          onChange={handleChange}
          placeholder="番組のタイトルを入力"
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          disabled={loading}
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          説明
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="番組の説明を入力"
          rows={4}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          disabled={loading}
        />
      </div>

      <div>
        <label htmlFor="author" className="block text-sm font-medium text-gray-700">
          著者
        </label>
        <input
          type="text"
          id="author"
          name="author"
          value={formData.author}
          onChange={handleChange}
          placeholder="著者の名前を入力"
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          disabled={loading}
        />
      </div>

      <div>
        <label htmlFor="category" className="block text-sm font-medium text-gray-700">
          カテゴリ
        </label>
        <input
          type="text"
          id="category"
          name="category"
          value={formData.category}
          onChange={handleChange}
          placeholder="カテゴリを入力"
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          disabled={loading}
        />
      </div>

      <div>
        <label htmlFor="language" className="block text-sm font-medium text-gray-700">
          言語 *
        </label>
        <select
          id="language"
          name="language"
          value={formData.language}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          disabled={loading}
        >
          <option value="ja">日本語</option>
          <option value="en">English</option>
          <option value="zh">中文</option>
        </select>
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading ? '作成中...' : '番組を作成'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="flex-1 rounded-md bg-gray-200 px-4 py-2 hover:bg-gray-300 disabled:bg-gray-400"
        >
          キャンセル
        </button>
      </div>
    </form>
  );
}
