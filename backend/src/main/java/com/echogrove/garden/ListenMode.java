package com.echogrove.garden;

/**
 * BLOOM plays the call tree generation by generation (most relaxing).
 * TRACE plays it in true depth-first call order (you hear the stack).
 */
public enum ListenMode {
    BLOOM,
    TRACE
}
