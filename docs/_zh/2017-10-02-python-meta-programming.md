---
tags:
  - python
  - tech
date: "2017-10-04 20:44:40"
---

# Python 元编程：控制你想控制的一切

很多人不理解“元编程”是个什么东西，关于它也没有一个十分准确的定义。这篇文章要说的是 Python 里的元编程，实际上也不一定就真的符合“元编程”的定义。只不过我无法找到一个更准确的名字来代表这篇文章的主题，所以就借了这么一个名号。
副标题是控制你想控制的一切，实际上这篇文章讲的都是一个东西，利用 Python 提供给我们的特性，尽可能的使代码优雅简洁。具体而言，通过编程的方法，在更高的抽象层次上对一种层次的抽象的特性进行修改。

首先说，Python 中一切皆对象，老生常谈。还有，Python 提供了许多特殊方法、元类等等这样的“元编程”机制。像给对象动态添加属性方法之类的，在 Python 中根本谈不上是“元编程”，但在某些静态语言中却是需要一定技巧的东西。我们来谈些 Python 程序员也容易被搞糊涂的东西。
我们先来把对象分分层次，通常我们知道一个对象有它的类型，老早以前 Python 就将类型也实现为对象。这样我们就有了实例对象和类对象。这是两个层次。稍有基础的读者就会知道还有元类这个东西的存在，简言之，元类就是“类”的“类”，也就是比类更高层次的东西。这又有了一个层次。还有吗？

## ImportTime vs RunTime

如果我们换个角度，不用非得和之前的三个层次使用同样的标准。我们再来区分两个东西：ImportTime 和 RunTime，它们之间也并非界限分明，顾名思义，就是两个时刻，导入时和运行时。
当一个模块被导入时，会发生什么？在全局作用域的语句（非定义性语句）被执行。函数定义呢？一个函数对象被创建，但其中的代码不会被执行。类定义呢？一个类对象被创建，类定义域的代码被执行，类的方法中的代码自然也不会被执行。
执行时呢？函数和方法中的代码会被执行。当然你要先调用它们。

## 元类

所以我们可以说元类和类是属于 ImportTime 的，import 一个模块之后，它们就会被创建。实例对象属于 RunTime，单 import 是不会创建实例对象的。不过话不能说的太绝对，因为如果你要是在模块作用域实例化类，实例对象也是会被创建的。只不过我们通常把它们写在函数里面，所以这样划分。
如果你想控制产生的实例对象的特性该怎么做？太简单了，在类定义中重写`init`方法。那么我们要控制类的一些性质呢？有这种需求吗？当然有！
经典的单例模式，大家都知道有很多种实现方式。要求就是，一个类只能有一个实例。
最简单的实现方法是这样的

```python
class _Spam:
    def __init__(self):
        print("Spam!!！")

_spam_singleton =None

def Spam():
    global _spam_singleton
    if _spam_singleton is not None:
        return _spam_singleton
    else:
        _spam_singleton = _Spam()
        return _spam_singleton
```

工厂模式，不太优雅。我们再来审视一下需求，要一个类只能有一个实例。我们在类中定义的方法都是实例对象的行为，那么要想改变类的行为，就需要更高层次的东西。元类在这个时候登场在合适不过了。前面说过，元类是类的类。也就是说，元类的`init`方法就是类的初始化方法。 我们知道还有`call`这个东西，它能让实例像函数那样被调用，那么元类的这个方法就是类在被实例化时调用的方法。
代码就可以写出来了:

```python
class Singleton(type):
    def __init__(self, *args, **kwargs):
        self._instance = None
        super().__init__(*args, **kwargs)

    def __call__(self, *args, **kwargs):
        if self._instance is None:
            self._instance = super().__call__(*args, **kwargs)
            return self._instance
        else:
            return self._instance


class Spam(metaclass=Singleton):
    def __init__(self):
        print("Spam!!!")
```

主要有两个地方和一般的类定义不同，一是 `Singleton` 的基类是 `type`，一是 `Spam` 定义的地方有一个 `metaclass=Singleton`。`type` 是什么？它是 `object` 的子类，`object` 是它的实例。也就是说，`type` 是所有类的类，也就是最基本的元类，它规定了一些所有类在产生时需要的一些操作。所以我们的自定义元类需要子类化 `type`。同时 `type`也是一个对象，所以它又是 `object` 的子类。有点不太好理解，大概知道就可以了。

## 装饰器

我们再来说说装饰器。大多数人认为装饰器是 Python 里面最难理解的概念之一。其实它不过就是一个语法糖，理解了函数也是对象之后。就可以很轻易的写出自己的装饰器了。

```python
from functools import wraps

def print_result(func):

    @wraps(func)
    def wrappper(*args, **kwargs):
        result = func(*args, **kwargs)
        print(result)
        return result

    return wrappper

@print_result
def add(x, y):
return x + y #相当于：
#add = print_result(add)

add(1, 3)
```

这里我们还用到了一个装饰器`@wraps`，它是用来让我们返回的内部函数 `wrapper` 和原来的函数拥有相同的函数签名的，基本上我们在写装饰器时都要加上它。

我在注释里写了，`@decorator` 这样的形式等价于 `func=decorator（func）`，理解了这一点，我们就可以写出更多种类的装饰器。比如类装饰器，以及将装饰器写成一个类。

```python
def attr_upper(cls):
    for attrname, value in cls.__dict__.items():
        if isinstance(value, str) and not value.startswith('__'):
            setattr(cls, attrname, bytes.decode(str.encode(value).upper()))
    return cls

@attr_upper
class Person:
    sex = 'man'

print(Person.sex) # MAN
```

注意普通的装饰器和类装饰器实现的不同点。

## 对数据的抽象--描述符

如果我们想让某一些类拥有某些相同的特性，或者说可以实现在类定义对其的控制，我们可以自定义一个元类，然后让它成为这些类的元类。如果我们想让某一些函数拥有某些相同的功能，又不想把代码复制粘贴一遍，我们可以定义一个装饰器。那么，假如我们想让实例的属性拥有某些共同的特点呢？有人可能会说可以用 `property`，当然可以。但是这些逻辑必须在每个类定义的时候都写一遍。如果我们想让这些类的实例的某些属性都有相同的特点的话，就可以自定义一个描述符类。
关于描述符，[这篇文章](https://docs.python.org/3/howto/descriptor.html)讲得很好，同时它还讲解了描述符是怎么隐藏在函数的背后，实现函数、方法的统一和不同的。这里我们给出一些例子。

```python
class TypedField:
    def __init__(self, _type):
        self._type = _type

    def __get__(self, instance, cls):
        if instance is None:
            return self
        else:
            return getattr(instance, self.name)

    def __set_name__(self, cls, name):
        self.name = name

    def __set__(self, instance, value):
        if not isinstance(value, self._type):
            raise TypeError('Expected' + str(self._type))
        instance.__dict__[self.name] = value

class Person:
    age = TypedField(int)
    name = TypedField(str)

    def __init__(self, age, name):
        self.age = age
        self.name = name

jack = Person(15, 'Jack')
jack.age = '15'  # 会报错
```

在这里面有几个角色，`TypedField` 是一个描述符类，`Person` 的属性是描述符类的实例，看似描述符是作为 `Person`，也就是类的属性而不是实例属性存在的。但实际上，一旦 `Person` 的实例访问了同名的属性，描述符就会起作用。需要注意的是，在 Python3.5 及之前的版本中，是没有`set_name`这个特殊方法的，这意味着如果你想要知道在类定义中描述符被起了一个什么样的名字，是需要在描述符实例化时显式传递给它的，也就是需要多一个参数。不过在 Python3.6 中，这个问题得到了解决，只需要在描述符类定义中重写`set_name`这个方法就好了。还需要注意的是`get`的写法，基本上对 `instance` 的判断是必需的，不然会报错。原因也不难理解，就不细说了。
控制子类的创建——代替元类的方法
在 Python3.6 中，我们可以通过实现`init_subclass`特殊方法，来自定义子类的创建，这样我们就可以在某些情况下摆脱元类这个讨厌的东西。

```python
class PluginBase:
    subclasses = []

    def __init_subclass__(cls, **kwargs):
        super().__init_subclass__(**kwargs)
        cls.subclasses.append(cls)

class Plugin1(PluginBase):
    pass

class Plugin2(PluginBase):
    pass
```

## 小结

诸如元类等元编程对于大多数人来说有些晦涩难懂，大多数时候也无需用到它们。但是大多数框架背后的实现都使用到了这些技巧，这样才能让使用者写出来的代码简洁易懂。如果你想更深入的了解这些技巧，可以参看一些书籍例如*Fluent Python*、_Python Cookbook_（这篇文章有的内容就是参考了它们），或者看官方文档中的某些章节例如上文说的描述符*HowTo*，还有*Data Model*一节等等。或者直接看 Python 的源码，包括用 Python 写的以及 CPython 的源码。
记住，只有在充分理解了它们之后再去使用，也不要是个地方就想着使用这些技巧。
