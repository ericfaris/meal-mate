import { afterEach, describe, expect, it, vi } from 'vitest';
import { downloadTextFile, pickImageFile } from './fileUtils';

afterEach(() => vi.restoreAllMocks());

function stubObjectUrls() {
  (URL as any).createObjectURL ??= () => '';
  (URL as any).revokeObjectURL ??= () => {};
  const create = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock');
  const revoke = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
  return { create, revoke };
}

describe('downloadTextFile', () => {
  it('clicks a temporary download link for the file and cleans up', async () => {
    const { create, revoke } = stubObjectUrls();
    const clicked: HTMLAnchorElement[] = [];
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
      clicked.push(this);
    });

    downloadTextFile('recipes.json', '{"a":1}');

    expect(clicked).toHaveLength(1);
    expect(clicked[0].download).toBe('recipes.json');
    expect(clicked[0].href).toBe('blob:mock');
    const blob = create.mock.calls[0][0] as Blob;
    expect(blob.type).toBe('application/json');
    expect(await blob.text()).toBe('{"a":1}');
    expect(revoke).toHaveBeenCalledWith('blob:mock');
    expect(document.querySelector('a[download]')).toBeNull();
  });
});

describe('pickImageFile', () => {
  function captureInput() {
    let input: HTMLInputElement | undefined;
    vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(function (this: HTMLInputElement) {
      input = this;
    });
    return () => input!;
  }

  it('resolves an object URL for the chosen image', async () => {
    stubObjectUrls();
    const getInput = captureInput();
    const result = pickImageFile();
    const input = getInput();
    expect(input.accept).toBe('image/*');

    const file = new File(['x'], 'card.png', { type: 'image/png' });
    Object.defineProperty(input, 'files', { value: [file] });
    input.dispatchEvent(new Event('change'));

    await expect(result).resolves.toBe('blob:mock');
    expect(document.querySelector('input[type=file]')).toBeNull();
  });

  it('resolves null when the chooser is cancelled', async () => {
    const getInput = captureInput();
    const result = pickImageFile();
    getInput().dispatchEvent(new Event('cancel'));
    await expect(result).resolves.toBeNull();
  });
});
