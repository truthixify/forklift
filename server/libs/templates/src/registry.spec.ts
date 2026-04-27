// Copyright 2025 Forklift. Apache-2.0 license.

import { TemplateRegistry } from './registry';

describe('TemplateRegistry', () => {
  let registry: TemplateRegistry;

  beforeEach(() => {
    registry = new TemplateRegistry();
  });

  it('has 3 registered templates', () => {
    expect(registry.getAll()).toHaveLength(15);
  });

  it('returns logo-design by id', () => {
    const t = registry.get('logo-design');
    expect(t).toBeDefined();
    expect(t!.name).toBe('Logo Design');
    expect(t!.category).toBe('Design');
  });

  it('returns lead-gen by id', () => {
    const t = registry.get('lead-gen');
    expect(t).toBeDefined();
    expect(t!.name).toBe('Lead Generation');
  });

  it('returns oss-py-bug by id', () => {
    const t = registry.get('oss-py-bug');
    expect(t).toBeDefined();
    expect(t!.name).toBe('OSS Python Bug Fix');
  });

  it('returns undefined for unknown id', () => {
    expect(registry.get('nonexistent')).toBeUndefined();
  });

  describe('bestMatch', () => {
    it('matches logo keywords', () => {
      const t = registry.bestMatch('I need a logo for my brand');
      expect(t?.id).toBe('logo-design');
    });

    it('matches lead-gen keywords', () => {
      const t = registry.bestMatch('Find me 50 B2B sales leads');
      expect(t?.id).toBe('lead-gen');
    });

    it('matches oss-py-bug keywords', () => {
      const t = registry.bestMatch('Fix this Python bug in my GitHub repo');
      expect(t?.id).toBe('oss-py-bug');
    });

    it('returns undefined for unmatched brief', () => {
      const t = registry.bestMatch('something completely unrelated xyz');
      expect(t).toBeUndefined();
    });
  });
});
