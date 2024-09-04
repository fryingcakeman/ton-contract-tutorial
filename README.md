


## CommonMsgInfoRelaxed
### int_msg_info

| 字段          | 类型                 | 大小（位） | 说明                  |
|-------------|--------------------|-------|---------------------|
| 0           | Bool               | 1     | 0开始                 |
| ihr_disable | Bool               | 1     | 是否禁用即时超立方路由（目前始终为真） |
| bounce      | Bool               | 1     | 是否在处理过程中出错时弹回消息     |
| bounced     | Bool               | 1     | 消息本身是否是弹回的结果        |
| src         | MsgAddress         | 2     | 源地址                 |
| dest        | MsgAddress         | 256   | 目的地址                |
| value       | CurrencyCollection |       | 消息值                 |
| ihr_fee     | Grams              | 4     |                     |
| fwd_fee     | Grams              | 4     |                     |
| create_lt   | uint64             | 64    |                     |
| create_at   | uint32             | 32    |                     |
| init        | Bool               | 1     | 没有init字段            |
| either      | Bool               | 1     | 消息体将就地序列化           |

如果消息是从智能合约发送的，其中一些字段将被重写为正确的值。特别是，验证者将重写`bounced`、`src`、`ihr_fee`、`fwd_fee`、`created_lt`和`created_at`。
这意味着两件事：
* 首先，另一个智能合约在处理消息时可以信任这些字段（发送者无法伪造来源地址、bounced标志位等）；
* 其次，在序列化时我们可以将任何有效值放入这些字段中（无论如何这些值都将被重写）。

消息的直接序列化如下所示：
```
  var msg = begin_cell()
    .store_uint(0, 1)             ;; tag
    .store_uint(1, 1)             ;; ihr_disabled
    .store_uint(1, 1)             ;; allow bounces
    .store_uint(0, 1)             ;; not bounced itself
    .store_slice(source)          ;; from addr
    .store_slice(destination)     ;; to addr
    .store_coins(amount)          ;; value
    .store_dict(extra_currencies) ;; extra value
    .store_coins(0)               ;; ihr_fee
    .store_coins(fwd_value)       ;; fwd_fee 
    .store_uint(cur_lt(), 64)     ;; lt of transaction
    .store_uint(now(), 32)        ;; unix time of transaction
    .store_uint(0, 1)             ;; no init-field flag (Maybe)
    .store_uint(0, 1)             ;; inplace message body flag (Either)
    
    .store_slice(msg_body)
  .end_cell();
```

使用快捷方式：
```
 var msg = begin_cell()
    .store_uint(0x18, 6)        ;; tag(0) + ihr_disabled(1) + bounce(1) + bounced(0) + source(00)
    .store_slice(addr)          ;; destination
    .store_coins(grams)         ;; amount
    .store_uint(0, 1 + 4 + 4 + 64 + 32 + 1 + 1) 
    
    .store_uint(ans_tag, 32)    ;; msg body
    .store_uint(query_id, 64);
```
首先，它将`0x18`值放入6位，即放入`0b011000`。
* 第一位是`0` — 1位前缀，表示它是`int_msg_info`。
* 然后有3位`1`、`1`和`0`，表示即时超立方路由被禁用，消息可以在处理过程中出错时回弹，消息本身不是回弹的结果。
* 然后应该是发送者地址，但由于它无论如何都会被重写，因此可以存储任何有效地址。最短的有效地址序列化是addr_none的序列化，它序列化为两位字符串`00`。

长度等于`1 + 4 + 4 + 64 + 32 + 1 + 1`的零字符串。
* 第一个位表示空的extra-currencies字典。
* 然后我们有两个长度为4位的字段。它们以VarUInteger 16编码为0。事实上，由于ihr_fee和fwd_fee将被重写，我们同样可以在那里放置零。
* 然后我们将零放入created_lt和created_at字段。这些字段也将被重写；然而，与费用不同，这些字段有固定长度，因此被编码为64位和32位长的字符串。
（我们已经序列化了消息头并传递到init/body）
* 接下来的零位表示没有init字段。
* 最后一个零位表示消息体将就地序列化。










