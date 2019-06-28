const assert = require('assert')
const stream = require('stream')
const util = require('util')

const nextTick = util.promisify(process.nextTick)
const {createReadStream} = require('streamifier')
const streamEqual = require('stream-equal')
const rcnb = require('../rcnb')

describe('RCNB', function() {
  it('should encode', function() {
    assert.strictEqual(rcnb.encode(new Uint8Array([114, 99, 110, 98])), 'ɌcńƁȓČņÞ')
    assert.strictEqual(rcnb.encode(new Uint8Array([222, 233, 111, 122, 222])), 'ȵßȑƈȓƇńÞƞƃ')
    assert.strictEqual(rcnb.encode(new TextEncoder('utf-8').encode('Who NB?')), 'ȐȼŃƅȓčƞÞƦȻƝƃŖć')
  })
  
  it('should decode', function() {
    assert.deepStrictEqual(rcnb.decode('ɌcńƁȓČņÞ'), new Uint8Array([114, 99, 110, 98]))
    assert.deepStrictEqual(rcnb.decode('ȵßȑƈȓƇńÞƞƃ'), new Uint8Array([222, 233, 111, 122, 222]))
    assert.strictEqual(new TextDecoder("utf-8").decode(rcnb.decode('ȐĉņþƦȻƝƃŔć')), 'RCNB!')
  })
})

describe('RCNB stream', function() {
  it('should encode from stream (partial)', async function() {
    let input = new stream.Readable
    input._read = () => {}

    let output = input.pipe(rcnb.encodeStream())
    output.setEncoding('utf-8')

    let result = ''
    input.push(Buffer.of(222, 233))
    await nextTick()
    result += output.read()

    assert.strictEqual(result, 'ȵßȑƈ')
  })

  it('should encode from stream (3+2)', async function() {
    let input = new stream.Readable
    input._read = () => {}

    let output = input.pipe(rcnb.encodeStream())
    output.setEncoding('utf-8')

    let result = ''
    input.push(Buffer.of(222, 233))
    await nextTick(); result += output.read()
    input.push(Buffer.of(111, 122, 222))
    input.push(null) // indicates EOF
    result += output.read()

    assert.strictEqual(result, 'ȵßȑƈȓƇńÞƞƃ')
  })

  it('should encode from stream (2+3)', async function() {
    let input = new stream.Readable
    input._read = () => {}

    let output = input.pipe(rcnb.encodeStream())
    output.setEncoding('utf-8')

    let result = ''
    input.push(Buffer.of(222, 233, 111))
    await nextTick(); result += output.read()
    input.push(Buffer.of(122, 222))
    input.push(null) // indicates EOF
    result += output.read()

    assert.strictEqual(result, 'ȵßȑƈȓƇńÞƞƃ')
  })

  it('should encode from stream (1+1+1+1+1)', async function() {
    let input = new stream.Readable
    input._read = () => {}

    let output = input.pipe(rcnb.encodeStream())
    output.setEncoding('utf-8')

    let result = ''
    input.push(Buffer.of(222))
    await nextTick(); result += output.read()
    input.push(Buffer.of(233))
    await nextTick(); result += output.read()
    input.push(Buffer.of(111))
    await nextTick(); result += output.read()
    input.push(Buffer.of(122))
    await nextTick(); result += output.read()
    input.push(Buffer.of(222))
    input.push(null) // indicates EOF
    result += output.read()

    assert.strictEqual(result, 'ȵßȑƈȓƇńÞƞƃ')
  })

  it('should encode from stream 2', async function() {
    let input = new stream.Readable
    input._read = () => {}

    let output = input.pipe(rcnb.encodeStream())
    output.setEncoding('utf-8')

    let result = ''
    input.push(Buffer.from(new TextEncoder('utf-8').encode('Who')))
    await nextTick(); result += output.read()
    input.push(Buffer.from(new TextEncoder('utf-8').encode(' NB?')))
    input.push(null) // indicates EOF
    result += output.read()

    assert.strictEqual(result, 'ȵßȑƈȓƇńÞƞƃ')
  })
  
  it('should decode from stream (2+3)', async function() {
    let input = new stream.Readable
    input._read = () => {}

    let output = input.pipe(rcnb.decodeStream())

    let results = []
    input.push(Buffer.from('ȵßȑƈ', 'utf-8'))
    await nextTick(); results.push(output.read())
    input.push('ȓƇńÞƞƃ')
    input.push(null) // indicates EOF
    results.push(output.read())

    assert.deepStrictEqual(Buffer.concat(results), Buffer.of(222, 233, 111, 122, 222))
  })

  it('should decode from stream (2.5+2.5)', async function() {
    let input = new stream.Readable
    input._read = () => {}

    let output = input.pipe(rcnb.decodeStream())

    let results = []
    input.push(Buffer.from('ȵßȑƈȓ', 'utf-8'))
    await nextTick(); results.push(output.read())
    input.push('ƇńÞƞƃ')
    input.push(null) // indicates EOF
    results.push(output.read())

    assert.deepStrictEqual(Buffer.concat(results), Buffer.of(222, 233, 111, 122, 222))
  })

  it('should decode from stream (3+2)', async function() {
    let input = new stream.Readable
    input._read = () => {}

    let output = input.pipe(rcnb.decodeStream())

    let results = []
    input.push('ȵßȑƈȓƇ')
    await nextTick(); results.push(output.read())
    input.push('ńÞƞƃ')
    input.push(null) // indicates EOF
    results.push(output.read())

    assert.deepStrictEqual(Buffer.concat(results), Buffer.of(222, 233, 111, 122, 222))
  })
})