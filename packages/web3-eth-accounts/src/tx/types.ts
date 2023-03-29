/*
This file is part of web3.js.

web3.js is free software: you can redistribute it and/or modify
it under the terms of the GNU Lesser General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

web3.js is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Lesser General Public License for more details.

You should have received a copy of the GNU Lesser General Public License
along with web3.js.  If not, see <http://www.gnu.org/licenses/>.
*/
import type { HexString, Numbers } from 'web3-types';
import { Buffer } from 'buffer';

import type { Common } from '../common/common';
import type { BufferLike, PrefixedHexString } from '../common/types';
import { Address } from './address';

/**
 * Can be used in conjunction with {@link Transaction.supports}
 * to query on tx capabilities
 */
export enum Capability {
	/**
	 * Tx supports EIP-155 replay protection
	 * See: [155](https://eips.ethereum.org/EIPS/eip-155) Replay Attack Protection EIP
	 */
	EIP155ReplayProtection = 155,

	/**
	 * Tx supports EIP-1559 gas fee market mechanism
	 * See: [1559](https://eips.ethereum.org/EIPS/eip-1559) Fee Market EIP
	 */
	EIP1559FeeMarket = 1559,

	/**
	 * Tx is a typed transaction as defined in EIP-2718
	 * See: [2718](https://eips.ethereum.org/EIPS/eip-2718) Transaction Type EIP
	 */
	EIP2718TypedTransaction = 2718,

	/**
	 * Tx supports access list generation as defined in EIP-2930
	 * See: [2930](https://eips.ethereum.org/EIPS/eip-2930) Access Lists EIP
	 */
	EIP2930AccessLists = 2930,
}

/**
 * The options for initializing a {@link Transaction}.
 */
export interface TxOptions {
	/**
	 * A {@link Common} object defining the chain and hardfork for the transaction.
	 *
	 * Object will be internally copied so that tx behavior don't incidentally
	 * change on future HF changes.
	 *
	 * Default: {@link Common} object set to `mainnet` and the default hardfork as defined in the {@link Common} class.
	 *
	 * Current default hardfork: `istanbul`
	 */
	common?: Common;
	/**
	 * A transaction object by default gets frozen along initialization. This gives you
	 * strong additional security guarantees on the consistency of the tx parameters.
	 * It also enables tx hash caching when the `hash()` method is called multiple times.
	 *
	 * If you need to deactivate the tx freeze - e.g. because you want to subclass tx and
	 * add additional properties - it is strongly encouraged that you do the freeze yourself
	 * within your code instead.
	 *
	 * Default: true
	 */
	freeze?: boolean;
}

/*
 * Access List types
 */

export type AccessListItem = {
	address: PrefixedHexString;
	storageKeys: PrefixedHexString[];
};

/*
 * An Access List as a tuple of [address: Buffer, storageKeys: Buffer[]]
 */
export type AccessListBufferItem = [Buffer, Buffer[]];
export type AccessListBuffer = AccessListBufferItem[];
export type AccessList = AccessListItem[];

export function isAccessListBuffer(
	input: AccessListBuffer | AccessList,
): input is AccessListBuffer {
	if (input.length === 0) {
		return true;
	}
	const firstItem = input[0];
	if (Array.isArray(firstItem)) {
		return true;
	}
	return false;
}

export function isAccessList(input: AccessListBuffer | AccessList): input is AccessList {
	return !isAccessListBuffer(input); // This is exactly the same method, except the output is negated.
}

export interface ECDSASignature {
	v: bigint;
	r: Buffer;
	s: Buffer;
}

/**
 * Legacy {@link Transaction} Data
 */
export type TxData = {
	/**
	 * The transaction's nonce.
	 */
	nonce?: Numbers | Buffer;

	/**
	 * The transaction's gas price.
	 */
	// eslint-disable-next-line @typescript-eslint/ban-types
	gasPrice?: Numbers | Buffer | null;

	/**
	 * The transaction's gas limit.
	 */
	gasLimit?: Numbers | Buffer;

	/**
	 * The transaction's the address is sent to.
	 */
	to?: Address | Buffer | HexString;

	/**
	 * The amount of Ether sent.
	 */
	value?: Numbers | Buffer;

	/**
	 * This will contain the data of the message or the init of a contract.
	 */
	data?: BufferLike;

	/**
	 * EC recovery ID.
	 */
	v?: Numbers | Buffer;

	/**
	 * EC signature parameter.
	 */
	r?: Numbers | Buffer;

	/**
	 * EC signature parameter.
	 */
	s?: Numbers | Buffer;

	/**
	 * The transaction type
	 */

	type?: Numbers;
};

/**
 * {@link AccessListEIP2930Transaction} data.
 */
export interface AccessListEIP2930TxData extends TxData {
	/**
	 * The transaction's chain ID
	 */
	chainId?: Numbers;

	/**
	 * The access list which contains the addresses/storage slots which the transaction wishes to access
	 */
	// eslint-disable-next-line @typescript-eslint/ban-types
	accessList?: AccessListBuffer | AccessList | null;
}

/**
 * {@link FeeMarketEIP1559Transaction} data.
 */
export interface FeeMarketEIP1559TxData extends AccessListEIP2930TxData {
	/**
	 * The transaction's gas price, inherited from {@link Transaction}.  This property is not used for EIP1559
	 * transactions and should always be undefined for this specific transaction type.
	 */
	// eslint-disable-next-line @typescript-eslint/ban-types
	gasPrice?: never | null;
	/**
	 * The maximum inclusion fee per gas (this fee is given to the miner)
	 */
	maxPriorityFeePerGas?: Numbers | Buffer;
	/**
	 * The maximum total fee
	 */
	maxFeePerGas?: Numbers | Buffer;
}

/**
 * Buffer values array for a legacy {@link Transaction}
 */
export type TxValuesArray = Buffer[];

/**
 * Buffer values array for an {@link AccessListEIP2930Transaction}
 */
export type AccessListEIP2930ValuesArray = [
	Buffer,
	Buffer,
	Buffer,
	Buffer,
	Buffer,
	Buffer,
	Buffer,
	AccessListBuffer,
	Buffer?,
	Buffer?,
	Buffer?,
];

/**
 * Buffer values array for a {@link FeeMarketEIP1559Transaction}
 */
export type FeeMarketEIP1559ValuesArray = [
	Buffer,
	Buffer,
	Buffer,
	Buffer,
	Buffer,
	Buffer,
	Buffer,
	Buffer,
	AccessListBuffer,
	Buffer?,
	Buffer?,
	Buffer?,
];

type JsonAccessListItem = { address: string; storageKeys: string[] };

/**
 * Generic interface for all tx types with a
 * JSON representation of a transaction.
 *
 * Note that all values are marked as optional
 * and not all the values are present on all tx types
 * (an EIP1559 tx e.g. lacks a `gasPrice`).
 */
export interface JsonTx {
	nonce?: string;
	gasPrice?: string;
	gasLimit?: string;
	to?: string;
	data?: string;
	v?: string;
	r?: string;
	s?: string;
	value?: string;
	chainId?: string;
	accessList?: JsonAccessListItem[];
	type?: string;
	maxPriorityFeePerGas?: string;
	maxFeePerGas?: string;
	maxFeePerDataGas?: string;
	versionedHashes?: string[];
}
