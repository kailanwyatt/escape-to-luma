import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { SPARK_CATALOG, sparkVisualProfile } from '../src/customization/sparks';

describe('spark portraits and hearts', () => {
  it('registers a portrait asset id for every catalog spark', () => {
    for (const spark of SPARK_CATALOG) {
      const id = sparkVisualProfile(spark).portraitAssetId;
      expect(id).toBe(`spark.${spark.id}`);
      const file = join(process.cwd(), 'assets/art/sparks', `spark-${spark.id}.png`);
      expect(existsSync(file)).toBe(true);
    }
  });

  it('ships filled and empty heart sprites', () => {
    expect(existsSync(join(process.cwd(), 'assets/art/ui/heart-full.png'))).toBe(true);
    expect(existsSync(join(process.cwd(), 'assets/art/ui/heart-empty.png'))).toBe(true);
  });
});
