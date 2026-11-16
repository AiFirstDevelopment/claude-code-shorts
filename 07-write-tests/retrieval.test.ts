// Copyright (c) 2026 Joel Stevick
// SPDX-License-Identifier: MIT
// Licensed under the MIT License: https://opensource.org/licenses/MIT

import { describe, expect, it } from 'vitest'
import { bm25, words, type Chunk } from '../src/retrieval'

const chunk = (id: string, text: string): Chunk => ({ id, file: 'f.pdf', page: 1, text })

describe('accents in search', () => {
  it('an accented word is one token, its accents off', () => {
    expect(words('résumé')).toEqual(['resume'])
    expect(words('naïve façade')).toEqual(['naive', 'facade'])
  })

  it('a capital accented letter matches its plain lower-case letter', () => {
    expect(words('ÉCOLE Ångström')).toEqual(['ecole', 'angstrom'])
  })

  it('a precomposed and a decomposed accent give the same token', () => {
    expect(words('résumé')).toEqual(words('résumé'))
  })

  it('an accented plural loses its "s" like a plain one', () => {
    expect(words('résumés cafés')).toEqual(['resume', 'cafe'])
  })

  it('a question without accents finds a chunk with them, and the other way round', () => {
    const chunks = [chunk('a', 'Attach your résumé to the form.'), chunk('b', 'Invoices are due monthly.')]
    expect(bm25(chunks, 'where is my resume', 5).map((c) => c.id)).toEqual(['a'])
    const plain = [chunk('a', 'Attach your resume to the form.'), chunk('b', 'Invoices are due monthly.')]
    expect(bm25(plain, 'where is my résumé', 5).map((c) => c.id)).toEqual(['a'])
  })
})

describe('words, as before the accents', () => {
  it('gives nothing for empty, blank or punctuation-only text', () => {
    expect(words('')).toEqual([])
    expect(words('   ')).toEqual([])
    expect(words('—!?…')).toEqual([])
  })

  it('still lower-cases, splits on punctuation, drops stop words and a plain plural\'s "s"', () => {
    expect(words('The Invoices, for the BUS & class!')).toEqual(['invoice', 'bus', 'class'])
  })
})
