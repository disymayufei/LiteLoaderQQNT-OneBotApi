export function truncateString(obj: any, maxLength = 500) {
  if (obj !== null && typeof obj === 'object') {
    Object.keys(obj).forEach((key) => {
      if (typeof obj[key] === 'string') {
        // 如果是字符串且超过指定长度，则截断
        if (obj[key].length > maxLength) {
          obj[key] = obj[key].substring(0, maxLength) + '...'
        }
      } else if (typeof obj[key] === 'object') {
        // 如果是对象或数组，则递归调用
        truncateString(obj[key], maxLength)
      }
    })
  }
  return obj
}

export function isNumeric(str: string) {
  return /^\d+$/.test(str)
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// 在保证老对象已有的属性不变化的情况下将新对象的属性复制到老对象
export function mergeNewProperties(newObj: any, oldObj: any) {
  Object.keys(newObj).forEach((key) => {
    // 如果老对象不存在当前属性，则直接复制
    if (!oldObj.hasOwnProperty(key)) {
      oldObj[key] = newObj[key]
    } else {
      // 如果老对象和新对象的当前属性都是对象，则递归合并
      if (typeof oldObj[key] === 'object' && typeof newObj[key] === 'object') {
        mergeNewProperties(newObj[key], oldObj[key])
      } else if (typeof oldObj[key] === 'object' || typeof newObj[key] === 'object') {
        // 属性冲突，有一方不是对象，直接覆盖
        oldObj[key] = newObj[key]
      }
    }
  })
}

export function isNull(value: unknown) {
  return value === undefined || value === null
}

/**
 * 将字符串按最大长度分割并添加换行符
 * @param str 原始字符串
 * @param maxLength 每行的最大字符数
 * @returns 处理后的字符串，超过长度的地方将会换行
 */
export function wrapText(str: string, maxLength: number): string {
  // 初始化一个空字符串用于存放结果
  let result: string = ''

  // 循环遍历字符串，每次步进maxLength个字符
  for (let i = 0; i < str.length; i += maxLength) {
    // 从i开始，截取长度为maxLength的字符串段，并添加到结果字符串
    // 如果不是第一段，先添加一个换行符
    if (i > 0) result += '\n'
    result += str.substring(i, i + maxLength)
  }

  return result
}


/**
 * 函数缓存装饰器，根据方法名、参数、自定义key生成缓存键，在一定时间内返回缓存结果
 * @param ttl 超时时间，单位毫秒
 * @param customKey 自定义缓存键前缀，可为空，防止方法名参数名一致时导致缓存键冲突
 * @returns 处理后缓存或调用原方法的结果
 */
export function cacheFunc(ttl: number, customKey: string = '') {
  const cache = new Map<string, { expiry: number; value: any }>()

  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor): PropertyDescriptor {
    const originalMethod = descriptor.value
    const className = target.constructor.name  // 获取类名
    const methodName = propertyKey             // 获取方法名
    descriptor.value = async function (...args: any[]) {
      const cacheKey = `${customKey}${className}.${methodName}:${JSON.stringify(args)}`
      const cached = cache.get(cacheKey)
      if (cached && cached.expiry > Date.now()) {
        return cached.value
      } else {
        const result = await originalMethod.apply(this, args)
        cache.set(cacheKey, { value: result, expiry: Date.now() + ttl })
        return result
      }
    }

    return descriptor
  }
}

export function CacheClassFuncAsync(ttl = 3600 * 1000, customKey = '') {
  function logExecutionTime(target: any, methodName: string, descriptor: PropertyDescriptor) {
    const cache = new Map<string, { expiry: number; value: any }>()
    const originalMethod = descriptor.value
    descriptor.value = async function (...args: any[]) {
      const key = `${customKey}${String(methodName)}.(${args.map(arg => JSON.stringify(arg)).join(', ')})`
      cache.forEach((value, key) => {
        if (value.expiry < Date.now()) {
          cache.delete(key)
        }
      })
      const cachedValue = cache.get(key)
      if (cachedValue && cachedValue.expiry > Date.now()) {
        return cachedValue.value
      }
      const result = await originalMethod.apply(this, args)
      cache.set(key, { expiry: Date.now() + ttl, value: result })
      return result
    }
  }
  return logExecutionTime
}

export function CacheClassFuncAsyncExtend(ttl: number = 3600 * 1000, customKey: string = '', checker: any = (...data: any[]) => { return true }) {
  function logExecutionTime(target: any, methodName: string, descriptor: PropertyDescriptor) {
    const cache = new Map<string, { expiry: number; value: any }>()
    const originalMethod = descriptor.value
    descriptor.value = async function (...args: any[]) {
      const key = `${customKey}${String(methodName)}.(${args.map(arg => JSON.stringify(arg)).join(', ')})`
      cache.forEach((value, key) => {
        if (value.expiry < Date.now()) {
          cache.delete(key)
        }
      })
      const cachedValue = cache.get(key)
      if (cachedValue && cachedValue.expiry > Date.now()) {
        return cachedValue.value
      }
      const result = await originalMethod.apply(this, args)
      if (!checker(...args, result)) {
        return result //丢弃缓存
      }
      cache.set(key, { expiry: Date.now() + ttl, value: result })
      return result
    }
  }
  return logExecutionTime
}

// forked from https://github.com/NapNeko/NapCatQQ/blob/6f6b258f22d7563f15d84e7172c4d4cbb547f47e/src/common/utils/helper.ts#L14
export class UUIDConverter {
  static encode(highStr: string, lowStr: string): string {
    const high = BigInt(highStr)
    const low = BigInt(lowStr)
    const highHex = high.toString(16).padStart(16, '0')
    const lowHex = low.toString(16).padStart(16, '0')
    const combinedHex = highHex + lowHex
    const uuid = `${combinedHex.substring(0, 8)}-${combinedHex.substring(8, 12)}-${combinedHex.substring(
      12,
      16,
    )}-${combinedHex.substring(16, 20)}-${combinedHex.substring(20)}`
    return uuid
  }

  static decode(uuid: string): { high: string; low: string } {
    const hex = uuid.replace(/-/g, '')
    const high = BigInt('0x' + hex.substring(0, 16))
    const low = BigInt('0x' + hex.substring(16))
    return { high: high.toString(), low: low.toString() }
  }
}