package dnt.monitor.engine.exception;

import dnt.monitor.exception.EngineException;

/**
 * <h1>SSH Exception</h1>
 *
 * @author Jay Xiong
 */
public class SshException extends EngineException {
    private int errorCode;

    public SshException(int errorCode, String message, Exception cause) {
        super(message, cause);
        this.errorCode = errorCode;
    }

    public SshException(int errorCode, String message) {
        this(errorCode, message, null);
    }

    public SshException(int errorCode, Exception cause) {
        this(errorCode, null, cause);
    }

    public int getErrorCode() {
        return errorCode;
    }
}
